import { jidNormalizedUser } from '@whiskeysockets/baileys'

export const run = async (m, { conn }) => {
    // 1. Identificar a quién besamos
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
    
    // Reacción
    m.react('💋')

    // 2. Definir el texto según la situación
    let str
    if (who === m.sender) {
        str = `\`${name2}\` *se besa a sí mismo porque nadie lo quiere, pobre gato.*`
    } else {
        str = `\`${name2}\` *le dio un beso apasionado a* \`${name}\`.`
    }

    // 3. Lista de videos (GIFs)
    const videos = [
        'https://files.catbox.moe/0p0gsn.mp4',
        'https://files.catbox.moe/me6rsr.mp4',
        'https://files.catbox.moe/untes1.mp4',
        'https://files.catbox.moe/8af0gd.mp4',
        'https://files.catbox.moe/z27nnd.mp4',
        'https://files.catbox.moe/c5fxap.mp4',
        'https://files.catbox.moe/2c3ejd.mp4'
    ]

    const video = videos[Math.floor(Math.random() * videos.length)]

    // 4. Enviar
    await conn.sendMessage(
        m.chat,
        { 
            video: { url: video }, 
            gifPlayback: true, 
            caption: str, 
            mentions: [m.sender, who] 
        },
        { quoted: m }
    )
}

export const config = {
    name: 'kiss',
    alias: ['besar', 'kiss2'],
    group: true // Para que solo funcione en grupos como pediste
}
