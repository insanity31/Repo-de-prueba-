import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

// <--- CONFIGURACIÓN DE NÚCLEO --->
global.botNumber = '' 
global.prefix = '/'
// Sistema de base de datos local activado por defecto en lib/database.js

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- DUEÑOS Y STAFF (B-MAX CORP) --->
global.owner = [
  ['18096758983', 'nevi'],
  ['573196722008', 'DuarteXV'], 
  ['50493732693', 'Hsjajzh'],
  ['51933000214', 'Ander'],
  ['573229506110', 'Duarte'],
  ['59162429797', 'kou'],
  ['5493873655135', 'Farguts'],
  ['212137662218436', 'Lid', true]
];

global.mods = []
global.prems = []

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- INFORMACIÓN TÉCNICA --->
global.libreria = 'Baileys'
global.baileys = 'github:gianpools/baileys' 
global.vs = '2.2.6'
global.nameqr = '🤖 B-MAX QR 🤖'
global.namebot = 'B-MAX - DUARTEXV'
global.sessions = 'BMax_Session' 

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- DISEÑO Y MARCA DE AGUA --->
global.packname = '🤖 𝐵-𝑀𝐴𝑋 𝐵𝑂𝑇 🤖'
global.botname = '† ʙ-ᴍᴀx ᴏꜰᴄ †'
global.wm = '🤖◟𝓑-𝓜𝓪𝔁 𝓞𝓯𝓬◞🤖'
global.author = '© DuarteXV'
global.dev = '© 🄿🄾🅆🄴🅁🄴🄳 DuarteXV'
global.textbot = 'Hola, yo soy B-Max, tu asistente personal de salud. Estoy aquí para servirte. Powered by DuarteXV.'
global.etiqueta = '🤖DuarteXV🤖'

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- MULTIMEDIA Y REDES --->
global.moneda = 'B-Max-Coins'
global.welcom1 = '¡Bienvenido! He detectado un nuevo integrante en mis sensores. ✨'
global.welcom2 = 'Espero que tu salud esté en óptimas condiciones. ¡Adiós! 🌟'
global.banner = 'https://files.catbox.moe/h4vif1.jpeg' 
global.avatar = 'https://files.catbox.moe/h4vif1.jpeg'

global.gp1 = 'https://chat.whatsapp.com/B9YHlQE1XVGDhyKhnSIrX2'
global.channel = 'https://whatsapp.com/channel/0029Vb73g1r1NCrTbefbFQ2T'
global.md = 'https://github.com/insanity31/Repo-de-prueba-'
global.correo = 'duartexv.ofc@gmail.com' 

global.rcanal = { 
  contextInfo: { 
    isForwarded: true, 
    forwardedNewsletterMessageInfo: { 
      newsletterJid: "120363350523130615@newsletter", 
      serverMessageId: 100, 
      newsletterName: "⏤͟͞ू⃪ 𝐁-𝐌𝐀𝐗 𝐂𝐎𝐑𝐏 𑁯🤖ᰍ"
    }
  }
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- CONFIGURACIÓN DE SISTEMA --->
global.emoji = '🤖'
global.emoji2 = '🏥'
global.emoji3 = '💉'

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

global.opts = {
  autoread: true,  
  queque: false 
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

// <--- AUTO-UPDATE --->
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.cyan.bold("🔄 El archivo 'settings.js' ha sido actualizado."))
  import(`${file}?update=${Date.now()}`)
})