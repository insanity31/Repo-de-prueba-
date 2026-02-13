import fetch from 'node-fetch'

export const run = async (m, { conn }) => {
    // 1. Identificar objetivo
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
    const name = conn.getName(who)
    const name2 = conn.getName(m.sender)
    
    m.react('💦')

    // 2. Texto
    let str = who === m.sender 
        ? `*${name2}* se vino solo... 🥑` 
        : `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`

    try {
        // 3. Descargar el video a un Buffer para asegurar el envío
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const response = await fetch(videoUrl)
        const buffer = await response.buffer()

        // 4. Enviar
        await conn.sendMessage(m.chat, { 
            video: buffer, // Enviamos el buffer directamente
            gifPlayback: true, 
            caption: str, 
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        // Si falla el buffer, intentamos el método directo por si las dudas
        await conn.sendMessage(m.chat, { 
            video: { url: 'https://files.catbox.moe/4ws6bs.mp4' }, 
            gifPlayback: true, 
            caption: str, 
            mentions: [m.sender, who] 
        }, { quoted: m })
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse', 'venirse'],
    group: true 
}
