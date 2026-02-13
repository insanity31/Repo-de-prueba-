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

async function startBMax() {
    database.load();
    const authFolder = global.sessions || './session_bmax';
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    // --- PASO 1: PREGUNTAR ANTES DE CREAR LA CONEXIÓN ---
    let opcion;
    let numero;
    
    if (!state.creds.registered) {
        console.clear();
        console.log(chalk.cyan.bold(`\n╔════════════════════════════════════╗\n║      🤖 SISTEMA DE VINCULACIÓN     ║\n╚════════════════════════════════════╝`));
        console.log(chalk.white(`1. Código QR\n2. Código de 8 dígitos`));
        
        opcion = await question(chalk.yellow('\nSelecciona una opción (1 o 2): '));

        if (opcion === '2') {
            numero = await question(chalk.cyan('\nEscribe tu número (Ej: 573229506110): '));
            numero = numero.replace(/[^0-9]/g, '');
        }
    }

    // --- PASO 2: AHORA SÍ, INICIAMOS EL SOCKET ---
    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    // --- PASO 3: MANDAR EL CÓDIGO SI ELIGIÓ LA OPCIÓN 2 ---
    if (opcion === '2' && !conn.authState.creds.registered) {
        console.log(chalk.gray('\nGenerando código...'));
        await delay(5000); // Delay para que el socket no se bugee en el host
        
        try {
            const code = await conn.requestPairingCode(numero);
            console.log(chalk.white('\n' + '─'.repeat(30)));
            console.log(chalk.black.bgWhite.bold(`  CÓDIGO: ${code}  `));
            console.log(chalk.white('─'.repeat(30) + '\n'));
        } catch (err) {
            console.log(chalk.red('❌ Error. Reinicia el bot.'));
            process.exit(1);
        }
    }

    // --- PROTOCOLOS Y EVENTOS ---
    if (comandos.size === 0) {
        const folder = './comandos';
        const files = fs.readdirSync(folder).filter(file => file.endsWith('.js'));
        for (const file of files) {
            try {
                const module = await import(`./comandos/${file}?v=${Date.now()}`);
                comandos.set(file.replace('.js', ''), module.default);
            } catch (e) {}
        }
    }

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
