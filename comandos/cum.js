import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimJID = null
        let victimName = ''
        
        const mentions = m.mentionedJid || []
        const quotedSender = m.quoted?.sender
        
        if (mentions.length > 0) {
            victimJID = mentions[0]
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
                console.log('Error LID:', err.message)
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
        const isAlone = !victimJID || senderNum === victimNum

        // ========== OBTENER NOMBRES ==========
        const senderName = m.pushName || db.users?.[m.sender]?.name || 'Usuario'
        
        if (!isAlone && !victimName) {
            try {
                // Método 1: Store de contactos (si existe)
                if (conn.contacts) {
                    const contact = conn.contacts[victimJID]
                    if (contact) {
                        victimName = contact.notify 
                            || contact.name 
                            || contact.verifiedName 
                            || ''
                    }
                }
                
                // Método 2: Base de datos local
                if (!victimName && db.users?.[victimJID]) {
                    victimName = db.users[victimJID].name || ''
                }
                
                // Método 3: Metadata del grupo
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

                // Método 4: getName si existe
                if (!victimName && typeof conn.getName === 'function') {
                    try {
                        const name = await conn.getName(victimJID)
                        if (name && !name.includes('+') && !/^\d+$/.test(name)) {
                            victimName = name
                        }
                    } catch {}
                }
            } catch (err) {
                console.log('Error obteniendo nombre:', err.message)
            }
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
        await m.react('💦')

        // ========== ENVIAR VIDEO ==========
        const { data } = await axios.get('https://files.catbox.moe/4ws6bs.mp4', {
            responseType: 'arraybuffer'
        })

        await conn.sendMessage(m.chat, {
            video: Buffer.from(data),
            mimetype: 'video/mp4',
            caption: text,
            gifPlayback: true,
            mentions: [] // Sin menciones porque usamos nombres con backticks
        }, { quoted: m })

    } catch (e) {
        console.error('❌ ERROR EN CUM:', e)
        m.reply('⚠️ Ocurrió un error al ejecutar el comando')
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    description: 'Comando NSFW',
    group: true,
    register: true  // Requiere registro para usar
}