import axios from 'axios'

// Función de limpieza profunda para asegurar que los números coincidan
const cleanId = (jid) => {
    if (!jid) return ''
    return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
}

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación de NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``)
        }

        // 1. OBTENCIÓN DEL OBJETIVO
        let victim = null
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            victim = m.mentionedJid[0]
        } else if (m.quoted) {
            victim = m.quoted.sender
        }

        // 2. PROCESAMIENTO DE IDENTIDADES (Comparación de números puros)
        const senderNumber = cleanId(m.sender)
        const victimNumber = victim ? cleanId(victim) : null

        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Solo es "solo" si no hay víctima o si el número es el mismo
        if (victimNumber && victimNumber !== senderNumber) {
            isAlone = false
            
            // Prioridad para el nombre: 
            // 1. pushName si es respuesta. 2. Nombre del contacto. 3. El número limpio.
            if (m.quoted && m.quoted.sender === victim && m.quoted.pushName) {
                targetName = m.quoted.pushName
            } else {
                let contactName = conn.getName ? conn.getName(victim) : null
                targetName = (contactName && !contactName.includes('@')) ? contactName : `@${victimNumber}`
            }
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO FINAL
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
            mentions: [m.sender, victim].filter(Boolean) 
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
