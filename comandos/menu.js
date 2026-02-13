import fs from 'fs'
import fetch from 'node-fetch'

export const run = async (m, { conn }) => {
    try {
        // 1. Cargar lista de comandos
        const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'))
        const listaComandos = commandFiles.map(file => `  ○ ${global.prefix}${file.replace('.js', '')}`).join('\n')

        // 2. Formatear la fecha
        const date = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

        // 3. Texto del Menú (Estilo Anya-MD)
        let menuTexto = `╭───────────────
│      「 *${global.botname}* 」
├───────────────
│
│ 📅 *Fecha:* ${date}
│ 👤 *Usuario:* @${m.sender.split('@')[0]}
│ 🛰️ *Prefijo:* [ ${global.prefix} ]
│
╰───────────────

╭───「 *LISTA DE COMANDOS* 」──
${listaComandos}
╰───────────────────`

        // 4. Miniatura (Buffer de la imagen)
        const thumb = await (await fetch('https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg')).buffer()

        // 5. Enviar mensaje de Documento
        await conn.sendMessage(m.chat, {
            document: { url: 'https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg' },
            mimetype: 'application/pdf', // ESTO activa la etiqueta roja
            fileName: `Menu - ${global.botname}.pdf`, // El .pdf es clave para el icono
            fileLength: 1999999999999, // Tamaño ficticio (aprox 1.8 TB)
            pageCount: 2026,
            caption: menuTexto,
            jpegThumbnail: thumb,
            mentions: [m.sender]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar el menú PDF.')
    }
}

export const config = {
    name: 'menu'
}
