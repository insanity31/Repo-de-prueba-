import './settings.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } from '@whiskeysockets/baileys';
import { handler } from './handler.js';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import { store } from './lib/store.js';
import { database } from './lib/database.js';
import print from './lib/print.js';

// Configuración de la terminal para leer la elección del usuario
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
        } catch (e) {
            print.error(`Fallo al cargar comando: ${file}`, e);
        }
    }
}

async function startBMax() {
    database.load();
    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    // --- Lógica de Vinculación ---
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
        printQRInTerminal: opcion === '1', // Solo imprime QR si eligió 1
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'],
    });

    // Si eligió Código de 8 dígitos
    if (opcion === '2' && !conn.authState.creds.registered) {
        const numero = await question(chalk.cyan('\nEscribe tu número de WhatsApp (ej: 57322...): '));
        const code = await conn.requestPairingCode(numero.replace(/[^0-9]/g, ''));
        console.log(chalk.white(`\nTu código de vinculación es: `) + chalk.bgWhite.black.bold(` ${code} `) + `\n`);
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
            console.log(chalk.cyan.bold(`\n  🤖 B-MAX CONECTADO EXITOSAMENTE\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
