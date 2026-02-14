import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. OBTENCIÓN DEL OBJETIVO
        let victim = null
        
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } else if (m.quoted?.sender) {
            victim = m.quoted.sender
        } else {
            const text = m.text || m.body || m.message?.conversation || 
                         m.message?.extendedTextMessage?.text || ''
            
            const mentionMatch = text.match(/@(\d+)/);
            if (mentionMatch) {
                victim = mentionMatch[1] + '@s.whatsapp.net'
            }
        }

        // --- CONVERSIÓN DE LID A JID ---
        if (victim && victim.endsWith('@lid') && m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
            const participant = groupMetadata?.participants?.find(p => 
                p.lid === victim || p.id === victim
            )
            if (participant?.id) {
                victim = participant.id
            } else {
                victim = null
            }
        }

        // 2. VALIDACIÓN DE JID
        if (victim && !victim.endsWith('@s.whatsapp.net') && !victim.endsWith('@lid')) {
            victim = null
        }

        // 3. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        const cleanNum = (jid) => {
            if (!jid) return ''
            return jid.split('@')[0].replace(/:\d+/g, '').trim()
        }

        const senderNum = cleanNum(m.sender)
        const victimNum = cleanNum(victim)

        if (victim && victimNum && senderNum && victimNum !== senderNum) {
            isAlone = false
            
            // 🔥 OBTENER NOMBRE SIN usar conn.getName()
            if (m.quoted?.pushName) {
                // Nombre del mensaje citado
                targetName = m.quoted.pushName
            } else if (m.isGroup) {
                // Buscar en metadatos del grupo
                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
                const participant = groupMetadata?.participants?.find(p => p.id === victim)
                
                if (participant) {
                    targetName = participant.notify || participant.name || `Usuario ${victimNum.slice(-4)}`
                } else {
                    targetName = `Usuario ${victimNum.slice(-4)}`
                }
            } else {
                // Chat privado: intentar obtener del contacto
                try {
                    const contact = await conn.getContact(victim)
                    targetName = contact?.notify || contact?.name || `Usuario ${victimNum.slice(-4)}`
                } catch {
                    targetName = `Usuario ${victimNum.slice(-4)}`
                }
            }
        }

        // 4. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. TEXTO
        let txt = isAlone 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 6. ENVÍO DE VIDEO
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
        console.error("❌ ERROR EN CUM:", e)
        m.reply("⚠️ Ocurrió un error al ejecutar el comando")
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}