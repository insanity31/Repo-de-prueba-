import { jidNormalizedUser } from '@whiskeysockets/baileys'

export const run = async (m, { conn }) => {
    // 1. Identificar a quién se etiqueta o se responde
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
    
    // Reacción inmediata
    m.react('💦')

    // 2. Texto del comando (Sin hora, solo la acción)
    let str
    if (who === m.sender) {
        str = `*${name2}* se vino solo... 🥑`
    } else {
        str = `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`
    }

    // 3. El video de GitHub que pediste
    const videoUrl = 'https://raw.githubusercontent.com/danielalejandrobasado-glitch/Yotsuba-MD-Premium/main/uploads/d7fafc060a9316ef.mp4'

    // 4. Enviar como Video con reproducción de GIF
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
