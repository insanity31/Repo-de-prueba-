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
        // Usamos axios porque es más estable para archivos grandes en servidores
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: data, // Aquí enviamos el video ya descargado
            gifPlayback: true, 
            caption: str, 
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.log("Error al enviar video:", e)
        m.reply("❌ El servidor de videos está lento, intenta de nuevo.")
    }
}

export const config = {
    name: 'cum',
    group: true 
}
