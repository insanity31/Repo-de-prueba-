import axios from 'axios'

// Limpieza total: solo números
const cleanNumber = (jid) => jid ? jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '') : ''

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``)
        }

        // 1. OBTENCIÓN DEL OBJETIVO (Triple Check)
        let victim = null
        const text = m.text || m.body || ''
        
        // Prioridad 1: Mención oficial de Baileys
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            victim = m.mentionedJid[0]
        } 
        // Prioridad 2: Extracción manual por texto (Si el handler falla)
        else if (text.includes('@')) {
            const extract = text.match(/@(\d+)/)
            if (extract) victim = extract[1] + '@s.whatsapp.net'
        }
        // Prioridad 3: Mensaje citado
        if (!victim && m.quoted) {
            victim = m.quoted.sender
        }

        // 2. LÓGICA DE IDENTIDADES
        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victim)
        
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Si hay un número de víctima y no es el mío
        if (victimNum && victimNum !== senderNum) {
            isAlone = false
            
            // Intentar sacar nombre
            if (m.quoted && m.quoted.sender === victim && m.quoted.pushName) {
                targetName = m.quoted.pushName
            } else {
                // Si conn.getName falla, usamos el número limpio
                try {
                    let n = conn.getName(victim)
                    targetName = (n && !n.includes('@')) ? n : `@${victimNum}`
                } catch {
                    targetName = `@${victimNum}`
                }
            }
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. VIDEO
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
