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

    // --- BLOQUE DE PREGUNTA INICIAL ---
    let opcion;
    if (!state.creds.registered) {
        console.clear();
        console.log(chalk.cyan.bold(`
╔════════════════════════════════════╗
║      🤖 SISTEMA DE VINCULACIÓN     ║
╚════════════════════════════════════╝`));
        console.log(chalk.white(`1. Código QR\n2. Código de 8 dígitos`));
        
        // Aquí capturamos la opción una sola vez
        opcion = await question(chalk.yellow('\nSelecciona una opción: '));
        
        // Si no elige nada válido, por defecto es QR para no trabar el bot
        if (!['1', '2'].includes(opcion)) opcion = '1'; 
    }

    // --- INICIO DE CONEXIÓN ---
    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    // --- LÓGICA DE PAIRING (SOLO SI ELIGIÓ 2) ---
    if (opcion === '2' && !conn.authState.creds.registered) {
        console.clear();
        console.log(chalk.magenta('┌──────────────────────────────────┐'));
        console.log(chalk.magenta('│    MODO CÓDIGO DE 8 DÍGITOS      │'));
        console.log(chalk.magenta('└──────────────────────────────────┘'));
        
        const numero = await question(chalk.cyan('\nIntroduce tu número (Ej: 573229506110): '));
        const numLimpio = numero.replace(/[^0-9]/g, '');
        
        console.log(chalk.gray('\nGenerando código...'));
        await delay(3000); 
        
        try {
            const code = await conn.requestPairingCode(numLimpio);
            console.log(chalk.white('\n' + '─'.repeat(30)));
            console.log(chalk.black.bgWhite.bold(`  CÓDIGO: ${code}  `));
            console.log(chalk.white('─'.repeat(30) + '\n'));
            console.log(chalk.yellow('Vincúlalo en tu WhatsApp > Dispositivos vinculados.'));
        } catch (err) {
            console.log(chalk.red('❌ Error al generar el código. Reinicia el bot.'));
            process.exit(1);
        }
    }

    // El resto del código se mantiene igual...
    store.bind(conn.ev);
    if (comandos.size === 0) { // Evita recargar comandos innecesariamente
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
            console.log(chalk.green.bold(`\n✅ B-MAX ACTIVO\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
