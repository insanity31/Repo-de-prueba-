import axios from 'axios'

export const run = async (m, { conn }) => {
    // 1. Identificamos al usuario sin usar getName
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
    
    // Sacamos el nombre directamente del pushName o del número
    const name = conn.contacts[who]?.name || who.split('@')[0]
    const name2 = m.pushName || 'Usuario'
    
    m.react('💦')

    let str = who === m.sender 
        ? `*${name2}* se vino solo... 🥑` 
        : `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`

    try {
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        
        // Descargamos el video como Buffer
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: data, 
            mimetype: 'video/mp4',
            caption: str, 
            gifPlayback: true,
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        // Si hay error, lo reportamos pero de forma que no mate el proceso
        console.error("ERROR EN VIDEO:", e)
        m.reply("❌ Hubo un fallo al procesar el video. Intenta de nuevo.")
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
