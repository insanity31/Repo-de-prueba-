process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
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
import readline from 'readline'
import { store } from './lib/store.js'
import { database } from './lib/database.js'

// --- ESTA ES LA LÓGICA DE CONSOLA QUE QUERÍAS (COMO ISAGI) ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

async function startBMax() {
    database.load()
    const { state, saveCreds } = await useMultiFileAuthState(global.sessions || './session_bmax')
    const { version } = await fetchLatestBaileysVersion()

    let opcion
    let phoneNumber = global.botNumber

    // Si no hay sesión, preguntamos EXACTAMENTE como en Isagi
    if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
        do {
            opcion = await question(chalk.bold.white("🤖 B-MAX: Seleccione una opción:\n") + chalk.blueBright("1. Con código QR\n") + chalk.cyan("2. Con código de texto de 8 dígitos\n--> "))
            
            if (!/^[1-2]$/.test(opcion)) {
                console.log(chalk.bold.redBright(`⚽ No se permiten números que no sean 1 o 2.`))
            }
        } while (opcion !== '1' && opcion !== '2')

        if (opcion === '2') {
            do {
                phoneNumber = await question(chalk.bgBlack(chalk.bold.blueBright(`\n[ 🤖 ] Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.magentaBright('---> ')}`)))
                phoneNumber = phoneNumber.replace(/\D/g, '')
            } while (phoneNumber.length < 8) // Validación simple de número
        }
    }

    const connectionOptions = {
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion === '1',
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        version
    }

    global.conn = makeWASocket(connectionOptions)
    conn.ev.on("creds.update", saveCreds)

    // Lógica del Pairing Code tal cual la pediste
    if (!fs.existsSync(`./${global.sessions}/creds.json`) && opcion === '2') {
        setTimeout(async () => {
            let addNumber = phoneNumber.replace(/\D/g, '')
            let codeBot = await conn.requestPairingCode(addNumber)
            codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
            console.log(chalk.bold.white(chalk.bgBlue(`\n[ 🤖 ] CÓDIGO B-MAX:`)), chalk.bold.white(chalk.white(` ${codeBot} `)))
        }, 3000)
    }

    // CARGA DE COMANDOS (NO PLUGINS)
    const comandos = new Map()
    const files = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'))
    for (const file of files) {
        const module = await import(`./comandos/${file}`)
        comandos.set(file.replace('.js', ''), module.default || module)
    }

    conn.ev.on('messages.upsert', async chatUpdate => {
        const m = chatUpdate.messages[0]
        if (!m.message || m.key.fromMe) return
        await handler(m, conn, comandos)
        database.save()
    })

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') console.log(chalk.green('\n✅ B-MAX ONLINE\n'))
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) startBMax()
        }
    })

    store.bind(conn.ev)
}

startBMax()
