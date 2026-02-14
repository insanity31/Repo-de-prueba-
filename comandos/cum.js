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
            } catch (err) {
                console.log('Error en conversión LID:', err.message)
            }
        }

        const cleanNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victimJID)
        const isAlone = !victimJID || !victimNum || senderNum === victimNum

        const senderName = m.pushName || 'Usuario'
        
        // 🔥 OBTENER NOMBRE USANDO conn.getContact() (API de Baileys)
        if (!isAlone && !victimName) {
            try {
                console.log('🔍 Intentando conn.getContact()...')
                const contact = await conn.getContact(victimJID)
                
                console.log('📱 Contacto obtenido:')
                console.log(JSON.stringify(contact, null, 2))
                
                victimName = contact?.notify 
                    || contact?.name 
                    || contact?.verifiedName
                    || contact?.vname
                    || ''
                
                console.log('   Nombre final:', victimName || '(vacío)')
            } catch (err) {
                console.log('❌ Error en getContact:', err.message)
            }
        }

        // 🔥 ÚLTIMO RECURSO: onWhatsApp para verificar si el número existe
        if (!isAlone && !victimName) {
            try {
                console.log('🔍 Intentando onWhatsApp()...')
                const [exists] = await conn.onWhatsApp(victimNum + '@s.whatsapp.net')
                
                if (exists) {
                    console.log('📱 Usuario existe en WhatsApp:')
                    console.log(JSON.stringify(exists, null, 2))
                    
                    victimName = exists?.notify 
                        || exists?.verifiedName
                        || ''
                    
                    console.log('   Nombre final:', victimName || '(vacío)')
                }
            } catch (err) {
                console.log('❌ Error en onWhatsApp:', err.message)
            }
        }

        // Fallback final
        if (!isAlone && !victimName) {
            victimName = 'Usuario'
            console.log('⚠️ Usando fallback: Usuario')
        }

        // ========== FORMATO ==========
        let text = ''
        
        if (isAlone) {
            text = `\`${senderName}\` se vino solo... 🥑`
        } else {
            text = `💦 ¡Uff! \`${senderName}\` se ha venido sobre \`${victimName}\`!`
        }

        // ========== REACCIÓN ==========
        await conn.sendMessage(m.chat, { 
            react: { text: '💦', key: m.key } 
        })

        // ========== VIDEO ==========
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
        console.error('❌ ERROR:', e)
        m.reply('⚠️ Ocurrió un error')
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}