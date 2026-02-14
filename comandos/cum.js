import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimJID = null
        let victimName = ''
        
        // MÉTODO 1: Menciones directas
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        
        // MÉTODO 2: Mensaje citado
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        const quotedSender = m.quoted?.sender
        
        // Prioridad de detección
        if (mentions.length > 0) {
            victimJID = mentions[0]
        } else if (quotedParticipant) {
            victimJID = quotedParticipant
            victimName = m.quoted?.pushName || ''
        } else if (quotedSender) {
            victimJID = quotedSender
            victimName = m.quoted?.pushName || ''
        }

        // ========== CONVERSIÓN DE LID A JID SI ES NECESARIO ==========
        if (victimJID && victimJID.includes('@lid') && m.isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => 
                    p.lid === victimJID || p.id === victimJID
                )
                
                if (participant) {
                    victimJID = participant.jid || participant.id
                    
                    if (!victimName) {
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || ''
                    }
                }
            } catch (err) {
                console.log('Error en conversión LID:', err.message)
            }
        }

        // ========== LIMPIAR NÚMEROS ==========
        const cleanNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victimJID)

        // ========== VALIDAR SI ESTÁ SOLO ==========
        const isAlone = !victimJID || !victimNum || senderNum === victimNum

        // ========== OBTENER NOMBRES FINALES ==========
        const senderName = m.pushName || 'Usuario'
        
        if (!isAlone && !victimName && m.isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => 
                    cleanNumber(p.id) === victimNum
                )
                
                if (participant) {
                    victimName = participant.notify 
                        || participant.name 
                        || participant.verifiedName 
                        || ''
                }
            } catch {
                // Si falla, se usará el formato @número
            }
        }

        // 🔥 FORMATO CON BACKTICKS
        let text = ''
        let mentionsList = [m.sender]
        
        if (isAlone) {
            text = `\`${senderName}\` se vino solo... 🥑`
        } else {
            mentionsList.push(victimJID)
            
            if (victimName) {
                text = `💦 ¡Uff! \`${senderName}\` se ha venido sobre \`${victimName}\`!`
            } else {
                text = `💦 ¡Uff! \`${senderName}\` se ha venido sobre @${victimNum}!`
            }
        }

        // ========== REACCIÓN ==========
        await conn.sendMessage(m.chat, { 
            react: { text: '💦', key: m.key } 
        })

        // ========== ENVIAR VIDEO ==========
        const { data } = await axios.get('https://files.catbox.moe/4ws6bs.mp4', {
            responseType: 'arraybuffer'
        })

        await conn.sendMessage(m.chat, {
            video: Buffer.from(data),
            mimetype: 'video/mp4',
            caption: text,
            gifPlayback: true,
            mentions: mentionsList
        }, { quoted: m })

    } catch (e) {
        console.error('❌ ERROR:', e)
        m.reply('⚠️ Ocurrió un error al ejecutar el comando')
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}