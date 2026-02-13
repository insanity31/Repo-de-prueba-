import axios from 'axios'

export const run = async (m, { conn }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
    const name = conn.getName(who)
    const name2 = conn.getName(m.sender)
    
    m.react('💦')

    let str = who === m.sender 
        ? `*${name2}* se vino solo... 🥑` 
        : `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`

    try {
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        
        // Descargamos el video
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: data, 
            mimetype: 'video/mp4', // FORZAMOS el tipo de archivo
            caption: str, 
            gifPlayback: true, // Esto lo hace ver como un sticker animado/gif
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
        // Si falla el buffer, intentamos mandar la URL pero con mimetype forzado
        await conn.sendMessage(m.chat, { 
            video: { url: 'https://files.catbox.moe/4ws6bs.mp4' }, 
            mimetype: 'video/mp4',
            caption: str, 
            gifPlayback: true,
            mentions: [m.sender, who] 
        }, { quoted: m })
    }
}

export const config = {
    name: 'cum',
    group: true 
}
