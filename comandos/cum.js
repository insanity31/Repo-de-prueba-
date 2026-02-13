import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación de NSFW (Usando tu base de datos)
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``)
        }

        // 1. OBTENCIÓN MANUAL (La que te funcionó)
        // Busca en menciones, si no hay, busca en citado
        let victim = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)

        // 2. LÓGICA DE NOMBRES
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpieza básica de IDs para comparar
        const self = m.sender.split('@')[0]
        const target = victim ? victim.split('@')[0] : null

        if (target && target !== self) {
            isAlone = false
            // Si hay nombre en el citado lo usa, si no, el número limpio
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : `@${target}`
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. ENVÍO DE VIDEO (Catbox)
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
