import './settings.js';
// ESTOS SON LOS IMPORT QUE ME PEDISTE (LOS DEL INDEX DE ANTES)
import ws from '@whiskeysockets/baileys';
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore,
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

// --- CONFIGURACIÓN DE INTERFAZ ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const comandos = new Map();

async function startBMax() {
    database.load();
    const authFolder = global.sessions || './session_bmax';
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    // --- LÓGICA DE PREGUNTAS (SIN BUGS) ---
    let opcion;
    let numero;
    
    if (!state.creds.registered) {
        console.clear();
        console.log(chalk.cyan.bold(`\n🤖 B-MAX: SISTEMA DE VINCULACIÓN`));
        console.log(chalk.white(`1. Código QR\n2. Código de 8 dígitos`));
        
        opcion = await question(chalk.yellow('\nSelecciona una opción (1 o 2): '));

        if (opcion === '2') {
            numero = await question(chalk.cyan('\nEscribe tu número (Ej: 573229506110): '));
            numero = numero.replace(/[^0-9]/g, '');
        }
    }

    // --- INICIO DEL SOCKET ---
    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    // --- GENERACIÓN DE CÓDIGO ---
    if (opcion === '2' && !conn.authState.creds.registered) {
        console.log(chalk.gray('\nGenerando código B-MAX...'));
        await delay(5000); 
        
        try {
            const code = await conn.requestPairingCode(numero);
            console.log(chalk.white('\n' + '─'.repeat(30)));
            console.log(chalk.black.bgCyan.bold(`  CÓDIGO B-MAX: ${code}  `));
            console.log(chalk.white('─'.repeat(30) + '\n'));
        } catch (err) {
            console.log(chalk.red('❌ Error. Reinicia el bot.'));
            process.exit(1);
        }
    }

    // --- CARGA DE COMANDOS ---
    const folder = './comandos';
    if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter(file => file.endsWith('.js'));
        for (const file of files) {
            try {
                const module = await import(`./comandos/${file}?v=${Date.now()}`);
                comandos.set(file.replace('.js', ''), module.default);
            } catch (e) {}
        }
    }

    // --- EVENTOS ---
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

    store.bind(conn.ev);
}

startBMax();
