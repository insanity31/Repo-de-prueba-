export const run = async (m, { conn }) => {
    // 1. Identificar a quién se la mientan
    let who
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        who = m.mentionedJid[0]
    } else if (m.quoted) {
        who = m.quoted.sender
    } else {
        who = m.sender
    }

    const name = conn.getName(who)
    const name2 = conn.getName(m.sender)
    
    // Reacción de gotas
    m.react('💦')

    // 2. Texto del comando
    let str
    if (who === m.sender) {
        str = `*${name2}* se vino solo... 🥑`
    } else {
        str = `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`
    }

    // 3. El video de Catbox que pasaste
    const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'

    // 4. Enviar como Video/GIF
    await conn.sendMessage(
        m.chat,
        { 
            video: { url: videoUrl }, 
            gifPlayback: true, 
            caption: str, 
            mentions: [m.sender, who] 
        },
        { quoted: m }
    )
}

export const config = {
    name: 'cum',
    alias: ['correrse', 'venirse'],
    group: true 
}
