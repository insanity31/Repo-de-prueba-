import './settings.js';
import ws from '@whiskeysockets/baileys';
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    delay 
} = ws;

import { handler } from './handler.js';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import { store } from './lib/store.js';
import { database } from './lib/database.js';
import print from './lib/print.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const comandos = new Map();

async function cargarComandos() {
    const folder = './comandos';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    const files = fs.readdirSync(folder).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const module = await import(`./comandos/${file}?v=${Date.now()}`);
            comandos.set(file.replace('.js', ''), module.default);
        } catch (e) {}
    }
}

async function startBMax() {
    database.load();
    const authFolder = global.sessions || './session_bmax';
    
    // CREACIÓN INMEDIATA DE CARPETA (Evita el bug ENOENT de tus fotos)
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    let opcion;
    if (!state.creds.registered) {
        console.clear();
        console.log(chalk.cyan.bold(`
╔════════════════════════════════════╗
║      🤖 SISTEMA DE VINCULACIÓN     ║
╚════════════════════════════════════╝
¿Cómo deseas vincular a B-Max?

1. Código QR
2. Código de 8 dígitos (Pairing Code)
`));
        opcion = await question(chalk.yellow('Elige una opción (1 o 2): '));
    }

    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    if (opcion === '2' && !conn.authState.creds.registered) {
        console.log(chalk.magenta('\n--- CONFIGURACIÓN DE PAIRING ---'));
        const numero = await question(chalk.cyan('Escribe tu número (Ej: 573229506110): '));
        const numLimpio = numero.replace(/[^0-9]/g, '');
        
        console.log(chalk.gray('Generando clave de acceso...'));
        await delay(3000); 
        
        try {
            const code = await conn.requestPairingCode(numLimpio);
            // Formato limpio para que no falle el SyntaxError
            console.log(chalk.white('\n' + '─'.repeat(40)));
            console.log(chalk.cyan('TU CÓDIGO DE VINCULACIÓN ES:'));
            console.log(chalk.black.bgWhite.bold(`    ${code}    `));
            console.log(chalk.white('─'.repeat(40) + '\n'));
        } catch (err) {
            console.log(chalk.red('❌ Error. Reinicia el bot.'));
            process.exit(1);
        }
    }

    store.bind(conn.ev);
    await cargarComandos();

    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(m, conn, comandos);
        database.save();
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.green.bold(`\n✅ B-MAX CONECTADO\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
