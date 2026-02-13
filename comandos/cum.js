import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Identificar al objetivo (quién recibe)
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
        
        // 2. Definir nombres (usamos el pushName o el número recortado)
        // name2 es el que envía, name es el que recibe
        let name2 = m.pushName || 'Alguien'
        let name = who === m.sender ? 'sí mismo' : `@${who.split('@')[0]}`
        
        m.react('💦')

        // 3. Texto del mensaje
        let str = who === m.sender 
            ? `*${name2}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${name2}* se ha venido sobre ${name}!`

        // 4. Descargar video de Catbox
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        // 5. Enviar mensaje
        await conn.sendMessage(m.chat, { 
            video: buffer, 
            mimetype: 'video/mp4',
            caption: str, 
            gifPlayback: true,
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR CRÍTICO EN CUM:", e)
        m.reply(`❌ Hubo un error al ejecutar el comando.`)
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
