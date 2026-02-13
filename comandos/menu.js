import fs from 'fs'

export const run = async (m, { conn }) => {
    try {
        // 1. Leer comandos de la carpeta
        const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'))
        const listaComandos = commandFiles.map(file => `  ○ ${global.prefix}${file.replace('.js', '')}`).join('\n')

        // 2. Texto del menú
        let menuTexto = `╭───「 *${global.botname}* 」────
│ 
│ 📅 *Fecha:* ${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
│ 👤 *Usuario:* @${m.sender.split('@')[0]}
│ 🛰️ *Prefijo:* [ ${global.prefix} ]
│ 
╰───────────────────

╭───「 *LISTA DE COMANDOS* 」──
${listaComandos}
╰───────────────────`

        // 3. Enviar como DOCUMENTO para el efecto de 1.8 TB
        await conn.sendMessage(m.chat, {
            document: { url: 'https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg' }, // Usamos la imagen como "archivo"
            mimetype: 'application/pdf', // Engañamos a WA diciendo que es un PDF
            fileName: `Menu - ${global.botname}`, 
            fileLength: 1999999999999, // Aquí está el truco del tamaño (aprox 1.8 TB)
            pageCount: 2026, // Las páginas que se ven en la foto
            caption: menuTexto,
            jpegThumbnail: await (await fetch('https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/aaafe7fe2e2dcd43.jpg')).buffer(), // Miniatura de la foto
            mentions: [m.sender]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar el menú tipo documento.')
    }
}

export const config = {
    name: 'menu'
}
