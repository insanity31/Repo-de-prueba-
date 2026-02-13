import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``);
        }

        // 1. DETERMINAR VÍCTIMA (Menciones tienen prioridad absoluta)
        let victim = null
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            victim = m.mentionedJid[0] 
        } else if (m.quoted) {
            victim = m.quoted.sender
        }

        // 2. LÓGICA DE COMPARACIÓN (Limpieza de ID)
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        if (victim) {
            const self = m.sender.split('@')[0].split(':')[0]
            const target = victim.split('@')[0].split(':')[0]

            // Solo es "solo" si no hay víctima o la víctima soy yo mismo
            if (target !== self) {
                isAlone = false
                // Si es citado, sacamos el pushName. Si es mención, usamos el número o nombre de contacto
                targetName = (m.quoted && m.quoted.sender === victim && m.quoted.pushName) 
                    ? m.quoted.pushName 
                    : (conn.getName ? conn.getName(victim) : `@${target}`)
                
                // Limpieza extra por si conn.getName devuelve el JID completo
                if (targetName.includes('@')) targetName = targetName.split('@')[0]
            }
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO FORMATEADO
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
