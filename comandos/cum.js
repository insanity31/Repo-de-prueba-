import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``);
        }

        // 1. OBTENCIÓN DEL OBJETIVO (Mención o Citado)
        let victim = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
        
        // 2. LÓGICA DE NOMBRES (Sin usar conn.getName para evitar el error)
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        const selfId = m.sender.split('@')[0]
        const targetId = victim ? victim.split('@')[0] : null

        if (targetId && targetId !== selfId) {
            isAlone = false
            // Intentamos sacar el nombre del citado, si no, usamos el número limpio
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : `@${targetId}`
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO CON FORMATO ` `
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. ENVÍO DE VIDEO
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, victim].filter(v => v) 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['leche', 'correrse'],
    group: true 
}
