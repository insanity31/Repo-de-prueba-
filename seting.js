import './settings.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { handler } from './handler.js';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import pino from 'pino';
import fs from 'fs';

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
            console.log(chalk.red(`❌ Error en comando ${file}: ${e.message}`));
        }
    }
    console.log(chalk.white.bgBlue.bold(` 🤖 B-MAX: ${comandos.size} PROTOCOLOS LISTOS `));
}

async function startBMax() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);

    const conn = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'], // Conexión modo Safari
        logger: pino({ level: 'silent' })
    });

    await cargarComandos();

    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(m, conn, comandos);
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.cyan.bold(`\n` + 
            `  ╔════════════════════════════════════╗\n` +
            `  ║      ${global.namebot} ACTIVADO        ║\n` +
            `  ╠════════════════════════════════════╣\n` +
            `  ║ > Status: Online (Safari)          ║\n` +
            `  ║ > Powered by: DuarteXV             ║\n` +
            `  ║ > Repo: insanity31/Repo-de-prueba- ║\n` +
            `  ╚════════════════════════════════════╝\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();

