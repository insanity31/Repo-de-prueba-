import './settings.js';
// Importación robusta para evitar el error "not a function"
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

// Configuración para lectura en consola
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const comandos = new Map();

// Cargador de protocolos (comandos)
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
    console.log(chalk.white.bgBlue.bold(` 🤖 B-MAX: ${comandos.size} PROTOCOLOS LISTOS `));
}

async function startBMax() {
    // Carga la base de datos local JSON
    database.load();

    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    // Lógica de vinculación (QR o Código)
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
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'], // Navegador Safari
    });

    // Proceso para Código de 8 dígitos
    if (opcion === '2' && !conn.authState.creds.registered) {
        const numero = await question(chalk.cyan('\nEscribe tu número de WhatsApp (ej: 573229506110): '));
        // Esperamos un poco para que el socket esté listo
        await delay(3000);
        const code = await conn.requestPairingCode(numero.replace(/[^0-9]/g, ''));
        console.log(chalk.white(`\nTu código de vinculación es: `) + chalk.bgWhite.black.bold(` ${code} `) + `\n`);
    }

    // Vincular el store para memoria de mensajes
    store.bind(conn.ev);
    await cargarComandos();

    // Escuchador de mensajes
    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        
        // Ejecutamos el handler y guardamos la DB
        await handler(m, conn, comandos);
        database.save();
    });

    conn.ev.on('creds.update', saveCreds);

    // Manejo de conexión y reconexión
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════╗
  ║        🤖 B-MAX SYSTEM ACTIVATED         ║
  ╠══════════════════════════════════════════╣
  ║ > Status: Conexión Establecida           ║
  ║ > Database: Local JSON                   ║
  ║ > Powered by: DuarteXV                   ║
  ╚══════════════════════════════════════════╝
            `));
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                print.error("Sesión cerrada. Borra la carpeta de sesión para re-vincular.");
            } else {
                print.info("Reconectando circuitos de B-Max...");
                startBMax();
            }
        }
    });
}

// Iniciar sistema
startBMax().catch(e => print.error("Fallo crítico", e));
