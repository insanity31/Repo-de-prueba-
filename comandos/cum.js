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
        
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        const quotedSender = m.quoted?.sender
        
        if (mentions.length > 0) {
            victimJID = mentions[0]
        } else if (quotedParticipant) {
            victimJID = quotedParticipant
            victimName = m.quoted?.pushName || ''
        } else if (quotedSender) {
            victimJID = quotedSender
            victimName = m.quoted?.pushName || ''
        }

        // ========== CONVERSIÓN DE LID A JID ==========
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
            } catch {}
        }

        // ========== VALIDACIÓN ==========
        const cleanNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victimJID)
        const isAlone = !victimJID || !victimNum || senderNum === victimNum

        const senderName = m.pushName || 'Usuario'
        
        // ========== OBTENER NOMBRE (VERSIÓN OFICIAL DE BAILEYS) ==========
        if (!isAlone && !victimName) {
            try {
                // Método 1: Store de contactos (Baileys oficial)
                const storeContact = conn.store?.contacts?.[victimJID]
                if (storeContact) {
                    victimName = storeContact.notify 
                        || storeContact.name 
                        || storeContact.verifiedName 
                        || ''
                }
                
                // Método 2: fetchStatus (puede traer el nombre)
                if (!victimName && typeof conn.fetchStatus === 'function') {
                    try {
                        const status = await conn.fetchStatus(victimJID)
                        victimName = status?.notify || ''
                    } catch {}
                }
                
                // Método 3: Metadata del grupo (búsqueda final)
                if (!victimName && m.isGroup) {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    const participant = groupMeta.participants.find(p => 
                        cleanNumber(p.id) === victimNum || p.lid === victimJID
                    )
                    
                    if (participant) {
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || ''
                    }
                }
            } catch {}
        }

        // Fallback a "Usuario"
        if (!isAlone && !victimName) {
            victimName = 'Usuario'
        }

        // ========== FORMATO CON BACKTICKS ==========
        const text = isAlone
            ? `\`${senderName}\` se vino solo... 🥑`
            : `💦 ¡Uff! \`${senderName}\` se ha venido sobre \`${victimName}\`!`

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
            mentions: []
        }, { quoted: m })

    } catch (e) {
        console.error('❌ ERROR EN CUM:', e)
        m.reply('⚠️ Ocurrió un error al ejecutar el comando')
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}