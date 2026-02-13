import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. OBTENCIÓN DEL OBJETIVO (con múltiples fallbacks)
        let victim = null
        
        // Prioridad 1: Mensaje citado
        if (m.quoted?.sender) {
            victim = m.quoted.sender
        }
        // Prioridad 2: Mención en el texto
        else if (m.msg?.contextInfo?.mentionedJid?.[0]) {
            victim = m.msg.contextInfo.mentionedJid[0]
        }
        // Prioridad 3: Participante del contexto
        else if (m.msg?.contextInfo?.participant) {
            victim = m.msg.contextInfo.participant
        }

        // 2. LIMPIEZA Y NORMALIZACIÓN DE IDs
        const cleanId = (jid) => {
            if (!jid) return null
            // Elimina @s.whatsapp.net, @lid, :XX, etc.
            return jid.replace(/@s\.whatsapp\.net|@lid|:\d+/g, '').split('@')[0]
        }

        const selfClean = cleanId(m.sender)
        const targetClean = cleanId(victim)

        // 3. OBTENCIÓN DE NOMBRES (con múltiples fallbacks)
        const getName = async (jid) => {
            if (!jid) return null
            
            try {
                // Intento 1: pushName del mensaje citado
                if (m.quoted?.sender === jid && m.quoted.pushName) {
                    return m.quoted.pushName
                }
                
                // Intento 2: Verificar en contactos del grupo
                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
                if (groupMetadata) {
                    const participant = groupMetadata.participants.find(
                        p => cleanId(p.id) === cleanId(jid)
                    )
                    if (participant?.notify || participant?.name) {
                        return participant.notify || participant.name
                    }
                }
                
                // Intento 3: Verificar nombre en WhatsApp
                const [contact] = await conn.onWhatsApp(jid).catch(() => [null])
                if (contact?.notify) return contact.notify
                
               
                const number = cleanId(jid)
                return number ? `+${number}` : 'Usuario'
                
            } catch {
                return cleanId(jid) || 'Usuario'
            }
        }

        const nameSender = m.pushName || await getName(m.sender) || 'Usuario'
        const targetName = victim ? await getName(victim) : null

        
        const isAlone = !targetClean || targetClean === selfClean

        // 5. REACCIÓN
        await conn.sendMessage(m.chat, { 
            react: { text: '💦', key: m.key } 
        })

        
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { 
            responseType: 'arraybuffer',
            timeout: 10000 
        })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, victim].filter(Boolean) 
        }, { quoted: m })

    } catch (e) {
        console.error("❌ ERROR EN CUM:", e.message || e)
        await conn.reply(m.chat, '⚠️ Ocurrió un error al ejecutar el comando.', m)
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}