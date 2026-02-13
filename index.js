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

// Configuración de Readline (Aseguramos que el input sea visible)
const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    terminal: true 
});

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
        } catch (e) {
            print.error(`Fallo al cargar comando: ${file}`, e);
        }
    }
}

async function startBMax() {
    database.load();

    // Asegurar que la carpeta de sesión existe para evitar el error ENOENT
    if (!fs.existsSync(global.sessions)) {
        fs.mkdirSync(global.sessions, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    let opcion;
    if (!state.creds.registered) {
        console.log(chalk.cyan.bold(`\n¿Cómo deseas vincular a B-Max?\n`));
        console.log(chalk.white(`1. Código QR`));
        console.log(chalk.white(`2. Código de 8 dígitos (Pairing Code)\n`));
        opcion = await question(chalk.yellow('Elige una opción (1 o 2): '));
    }

    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'],
    });

    if (opcion === '2' && !conn.authState.creds.registered) {
        // Ahora el número aparecerá mientras lo escribes
        const numero = await question(chalk.cyan('\nEscribe tu número (ej: 573229506110): '));
        await delay(3000);
        const code = await conn.requestPairingCode(numero.replace(/[^0-9]/g, ''));
        console.log(chalk.white(`\nTu código es: `) + chalk.bgWhite.black.bold(` ${code} `) + `\n`);
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
            console.log(chalk.green.bold(`\n🤖 B-MAX CONECTADO Y ESCANEANDO CHATS...\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
