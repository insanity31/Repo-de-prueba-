import './settings.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { handler } from './handler.js';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import pino from 'pino';
import fs from 'fs';
import { store } from './lib/store.js';
import { database } from './lib/database.js';
import print from './lib/print.js';

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
            print.error(`Fallo al cargar el comando: ${file}`, e);
        }
    }
    console.log(chalk.white.bgBlue.bold(` 🤖 B-MAX: ${comandos.size} COMANDOS CARGADOS `));
}

async function startBMax() {
    // Cargar Base de Datos Local únicamente
    database.load();

    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'],
        logger: pino({ level: 'silent' })
    });

    store.bind(conn.ev);
    await cargarComandos();

    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(m, conn, comandos);
        
        // Guardar automáticamente después de cada interacción
        database.save();
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.cyan.bold(`\n` + 
            `  ╔════════════════════════════════════╗\n` +
            `  ║      ${global.namebot} ACTIVADO        ║\n` +
            `  ╠════════════════════════════════════╣\n` +
            `  ║ > Status: Conectado (Safari)       ║\n` +
            `  ║ > Database: Local (JSON)           ║\n` +
            `  ║ > Powered by: DuarteXV             ║\n` +
            `  ╚════════════════════════════════════╝\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
