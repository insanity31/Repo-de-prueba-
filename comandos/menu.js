import fs from 'fs'
import fetch from 'node-fetch'

export const run = async (m, { conn }) => {
    try {
        // 1. Obtener lista de comandos
        const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'))
        const listaComandos = commandFiles.map(file => `  ○ ${global.prefix}${file.replace('.js', '')}`).join('\n')

        // 2. Descargar la imagen para convertirla en Buffer (ESTO ES LA CLAVE)
        const response = await fetch('https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg')
        const buffer = await response.buffer()

        // 3. Texto del Menú
        let menuTexto = `╭───────────────
│      「 *${global.botname}* 」
├───────────────
│
│ 📅 *Fecha:* ${new Date().toLocaleDateString('es-MX')}
│ 👤 *Usuario:* @${m.sender.split('@')[0]}
│ 🛰️ *Prefijo:* [ ${global.prefix} ]
│
╰───────────────

╭───「 *LISTA DE COMANDOS* 」──
${listaComandos}
╰───────────────────`

        // 4. Enviar el mensaje como documento real
        await conn.sendMessage(m.chat, {
            document: buffer, // Enviamos los datos descargados, no la URL
            mimetype: 'application/pdf',
            fileName: `${global.botname}.pdf`, // El nombre DEBE terminar en .pdf
            fileLength: 999999999999, 
            pageCount: 2026,
            caption: menuTexto,
            jpegThumbnail: buffer, // Usamos la misma imagen de miniatura
            mentions: [m.sender]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error al procesar el PDF del menú.')
    }
}

export const config = {
    name: 'menu'
}
