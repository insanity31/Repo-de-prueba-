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

// --- CONFIGURACIÓN DE TERMINAL BLINDADA ---
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
            print.error(`Error en comando: ${file}`, e);
        }
    }
}

async function startBMax() {
    // 1. Cargar DB
    database.load();

    // 2. Crear carpeta de sesión ANTES de iniciar (Evita el error ENOENT de tus fotos)
    if (!fs.existsSync(global.sessions)) {
        fs.mkdirSync(global.sessions, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    let opcion;
    if (!state.creds.registered) {
        console.log(chalk.cyan.bold(`\n¿CÓMO DESEAS VINCULAR A B-MAX?\n`));
        console.log(chalk.white(`1. Código QR`));
        console.log(chalk.white(`2. Código de 8 dígitos (Pairing Code)\n`));
        opcion = await question(chalk.yellow('Elige una opción (1 o 2) y presiona ENTER: '));
    }

    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ['Ubuntu', 'Chrome', '20.0.04'], // Cambiado para mayor compatibilidad de Pairing
    });

    // --- LÓGICA DE PAIRING CODE MEJORADA ---
    if (opcion === '2' && !conn.authState.creds.registered) {
        console.log(chalk.magenta('\n--- MODO CÓDIGO DE VINCULACIÓN ---'));
        const numero = await question(chalk.cyan('Escribe tu número con código de país (ej: 573229506110): '));
        
        // Limpiamos el número de espacios o signos
        const numLimpio = numero.replace(/[^0-9]/g, '');
        
        console.log(chalk.yellow('Generando código...'));
        await delay(3000); // Tiempo para que el socket estabilice
        
        try {
            const code = await conn.requestPairingCode(numLimpio);
            console.log(chalk.black.bgCyan(` TU CÓDIGO ES: `) + chalk.black.bgWhite.bold(` ${code} `));
            console.log(chalk.white('Pégalo en la notificación de WhatsApp de tu celular.\n'));
        } catch (err) {
            console.log(chalk.red('Error al generar código. Reintenta en 10 segundos.'));
            startBMax();
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
            console.log(chalk.green.bold(`\n✅ B-MAX CONECTADO - SISTEMA OPERATIVO\n`));
        }
        if (connection === 'close') {
            const restart = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startBMax();
        }
    });
}

startBMax();
