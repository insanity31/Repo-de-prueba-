import fs from 'fs'
import fetch from 'node-fetch'

export const run = async (m, { conn }) => {
    try {
        // 1. Lista de comandos
        const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'))
        const listaComandos = commandFiles.map(file => `  ○ ${global.prefix}${file.replace('.js', '')}`).join('\n')

        // 2. Configuración de Fecha y Hora de Bogotá, Colombia
        const zonaHoraria = 'America/Bogota'
        const fechaCol = new Date().toLocaleDateString('es-CO', { 
            timeZone: zonaHoraria, 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        })
        const horaCol = new Date().toLocaleTimeString('es-CO', { 
            timeZone: zonaHoraria, 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        })

        // 3. Texto del Menú
        let menuTexto = `╭───────────────
│      「 *${global.botname}* 」
├───────────────
│
│ 📅 *Fecha:* ${fechaCol}
│ ⏰ *Hora:* ${horaCol} (CO)
│ 👤 *Usuario:* @${m.sender.split('@')[0]}
│ 🛰️ *Prefijo:* [ ${global.prefix} ]
│
╰───────────────

╭───「 *LISTA DE COMANDOS* 」──
${listaComandos}
╰───────────────────`

        // 4. Descargar imagen para el PDF
        const response = await fetch('https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg')
        const buffer = await response.buffer()

        // 5. Enviar Documento PDF
        await conn.sendMessage(m.chat, {
            document: buffer,
            mimetype: 'application/pdf',
            fileName: `${global.botname}.pdf`,
            fileLength: 1999999999999,
            pageCount: 2026,
            caption: menuTexto,
            jpegThumbnail: buffer,
            mentions: [m.sender]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar el menú.')
    }
}

export const config = {
    name: 'menu'
}
