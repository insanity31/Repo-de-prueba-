// --- TUS IMPORTS DE CONFIANZA ---
import './settings.js'
import ws from '@whiskeysockets/baileys'
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser,
    delay 
} = ws

import { handler } from './handler.js'
import { Boom } from '@hapi/boom'
import chalk from 'chalk'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { store } from './lib/store.js'
import { database } from './lib/database.js'
import print from './lib/print.js'

// --- CONFIGURACIÓN DE INTERFAZ ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))
const comandos = new Map()

// --- CARGADOR DE COMANDOS (NO PLUGINS) ---
async function cargarComandos() {
    const folder = './comandos'
    if (!fs.existsSync(folder)) fs.mkdirSync(folder)
    const files = fs.readdirSync(folder).filter(file => file.endsWith('.js'))
    for (const file of files) {
        try {
            const module = await import(`./comandos/${file}?v=${Date.now()}`)
            comandos.set(file.replace('.js', ''), module.default || module)
        } catch (e) {
            console.log(chalk.red(`❌ Error cargando comando: ${file}`))
        }
    }
}

async function startBMax() {
    database.load()
    const authFolder = global.sessions || './session_bmax'
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(authFolder)
    const { version } = await fetchLatestBaileysVersion()

    // --- LÓGICA DE VINCULACIÓN (PREGUNTAR ANTES DE ARRANCAR) ---
    let opcion
    let numero
    
    if (!state.creds.registered) {
        console.clear()
        console.log(chalk.cyan.bold(`\n🤖 B-MAX: SISTEMA DE VINCULACIÓN`))
        console.log(chalk.white(`1. Vincular con Código QR\n2. Vincular con Código de 8 dígitos`))
        
        opcion = await question(chalk.yellow('\nSeleccione una opción: '))

        if (opcion === '2') {
            const inputNum = await question(chalk.cyan('\nIngrese su número (Ej: 573229506110): '))
            numero = inputNum.replace(/[^0-9]/g, '')
        }
    }

    // --- INICIO DEL SOCKET ---
    const connectionOptions = {
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false
    }

    global.conn = makeWASocket(connectionOptions)
    conn.ev.on("creds.update", saveCreds)

    // --- SOLICITUD DE CÓDIGO ---
    if (!state.creds.registered && opcion === '2') {
        console.log(chalk.gray('\nGenerando código B-MAX...'))
        await delay(5000) 
        
        try {
            const code = await conn.requestPairingCode(numero)
            console.log(chalk.white('\n' + '─'.repeat(30)))
            console.log(chalk.black.bgCyan.bold(`  CÓDIGO B-MAX: ${code}  `))
            console.log(chalk.white('─'.repeat(30) + '\n'))
        } catch (err) {
            console.log(chalk.red('❌ Error. Reinicia el bot.'))
            process.exit(1)
        }
    }

    await cargarComandos()

    // --- MANEJO DE MENSAJES ---
    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0]
        if (!m.message || m.key.fromMe) return
        
        // El handler gestiona los comandos desde el Map()
        await handler(m, conn, comandos)
        database.save()
    })

    // --- ESTADO DE CONEXIÓN ---
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            console.log(chalk.green.bold(`\n✅ B-MAX ONLINE | DISPOSITIVO VINCULADO\n`))
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.yellow("🔄 Reconectando B-MAX..."))
                startBMax()
            }
        }
    })

    store.bind(conn.ev)
}

startBMax().catch(e => console.error(e))
