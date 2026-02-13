import './settings.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } from '@whiskeysockets/baileys';
import { handler } from './handler.js';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import pino from 'pino';
import fs from 'fs';
import { store } from './lib/store.js';
import { database } from './lib/database.js';
import { mongoDB } from './lib/mongoDB.js';
import print from './lib/print.js';

const comandos = new Map();

// Función para cargar protocolos (comandos)
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
    console.log(chalk.white.bgBlue.bold(` 🤖 B-MAX: ${comandos.size} PROTOCOLOS LISTOS `));
}

async function startBMax() {
    // Cargar Base de Datos Local
    database.load();
    
    // Conectar MongoDB si existe la URL en settings
    if (global.mongoURI) await mongoDB(global.mongoURI);

    const { state, saveCreds } = await useMultiFileAuthState(global.sessions);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        // Configuración Safari pedida
        browser: ['Safari (B-Max)', 'MacOS', '1.0.0'],
        logger: pino({ level: 'silent' }),
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return { conversation: "B-Max en línea" };
        }
    });

    // Vincular el store a la conexión
    store.bind(conn.ev);

    // Cargar Comandos
    await cargarComandos();

    // Manejador de Mensajes
    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        
        // Ejecutar el handler con todas las librerías inyectadas
        await handler(m, conn, comandos);
    });

    // Guardar credenciales de sesión
    conn.ev.on('creds.update', saveCreds);

    // Monitor de Conexión
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(chalk.yellow('📸 Escanea el código QR para activar a B-Max.'));
        }

        if (connection === 'open') {
            console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════╗
  ║        🤖 B-MAX SYSTEM ACTIVATED         ║
  ╠══════════════════════════════════════════╣
  ║ > Bot: ${global.namebot}          
  ║ > Mode: Safari Connection                
  ║ > Powered by: DuarteXV                   
  ║ > Status: Escaneando señales de salud... ║
  ╚══════════════════════════════════════════╝
            `));
            print.info("B-Max está listo para atender pacientes.");
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                print.error("Sesión cerrada. Elimina la carpeta de sesión y escanea de nuevo.");
            } else {
                print.info("Reconectando circuitos de B-Max...");
                startBMax();
            }
        }
    });
}

// Iniciar el bot
startBMax().catch(e => print.error("Fallo crítico en el inicio", e));

