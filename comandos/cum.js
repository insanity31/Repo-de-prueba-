import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        console.log('==================== INICIO CUM ====================')

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victim = null
        
        // 1. Revisar si hay mención en el mensaje
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            victim = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
            console.log('✅ Detectado desde mentionedJid')
        }
        // 2. Si no hay mención, revisar si respondió a un mensaje
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            victim = m.message.extendedTextMessage.contextInfo.participant
            console.log('✅ Detectado desde participant')
        }
        // 3. Si respondió a un mensaje (estructura alternativa)
        else if (m.quoted?.sender) {
            victim = m.quoted.sender
            console.log('✅ Detectado desde quoted.sender')
        }

        console.log('🎯 Victim original:', victim)
        console.log('🎯 Tipo de victim:', typeof victim)
        console.log('🎯 ¿Termina en @lid?:', victim?.endsWith('@lid'))
        console.log('🎯 ¿Es grupo?:', m.isGroup)

        // ========== CONVERTIR LID A JID ==========
        if (victim && typeof victim === 'string' && victim.includes('@lid')) {
            console.log('⚠️ LID DETECTADO - Iniciando conversión...')
            
            if (m.isGroup) {
                try {
                    console.log('📋 Obteniendo metadata del grupo...')
                    const groupMeta = await conn.groupMetadata(m.chat)
                    console.log('📋 Total participantes:', groupMeta.participants.length)
                    
                    // Mostrar todos los LIDs disponibles
                    console.log('📋 LIDs en el grupo:')
                    groupMeta.participants.forEach(p => {
                        if (p.lid) {
                            console.log('  -', p.lid, '→', p.id)
                        }
                    })
                    
                    const participant = groupMeta.participants.find(p => p.lid === victim)
                    
                    if (participant?.id) {
                        console.log('✅ LID CONVERTIDO:', victim, '→', participant.id)
                        victim = participant.id
                    } else {
                        console.log('❌ NO SE ENCONTRÓ EL LID EN LA LISTA')
                        victim = null
                    }
                } catch (err) {
                    console.log('❌ Error obteniendo metadata:', err.message)
                    victim = null
                }
            } else {
                console.log('⚠️ No es grupo, no se puede convertir LID')
                victim = null
            }
        }

        console.log('🎯 Victim FINAL:', victim)

        // ========== LIMPIAR NÚMEROS ==========
        const getNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNumber = getNumber(m.sender)
        const victimNumber = getNumber(victim)

        console.log('📞 Sender Number:', senderNumber)
        console.log('📞 Victim Number:', victimNumber)

        // ========== DETERMINAR SI ESTÁ SOLO ==========
        const isAlone = !victim || !victimNumber || senderNumber === victimNumber

        console.log('❓ ¿Está solo?:', isAlone)

        // ========== OBTENER NOMBRES ==========
        const senderName = m.pushName || 'Usuario'
        let victimName = ''

        if (!isAlone) {
            // 🔥 PRIORIDAD 1: Si respondió a un mensaje, usar pushName
            if (m.quoted?.pushName) {
                victimName = m.quoted.pushName
                console.log('✅ Nombre desde quoted.pushName:', victimName)
            }
            // 🔥 PRIORIDAD 2: Buscar en metadatos del grupo
            else if (m.isGroup) {
                try {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    
                    const participant = groupMeta.participants.find(p => {
                        const pNumber = getNumber(p.id)
                        return pNumber === victimNumber
                    })
                    
                    if (participant) {
                        console.log('👤 PARTICIPANTE ENCONTRADO:')
                        console.log(JSON.stringify(participant, null, 2))
                        
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || null
                        
                        if (victimName) {
                            console.log('✅ Nombre encontrado:', victimName)
                        } else {
                            console.log('⚠️ Participante sin nombre, usando número')
                            victimName = `+${victimNumber}`
                        }
                    } else {
                        console.log('❌ Participante NO encontrado en metadata')
                        victimName = `+${victimNumber}`
                    }
                } catch (err) {
                    console.log('❌ Error obteniendo metadata:', err.message)
                    victimName = `+${victimNumber}`
                }
            } else {
                victimName = `+${victimNumber}`
            }
        }

        // ========== CONSTRUIR MENSAJE ==========
        const text = isAlone 
            ? `*${senderName}* se vino solo... 🥑`
            : `💦 ¡Uff! *${senderName}* se ha venido sobre *${victimName}*!`

        console.log('📝 Texto final:', text)
        console.log('==================== FIN DEBUG ====================')

        // ========== REACCIÓN ==========
        await conn.sendMessage(m.chat, { 
            react: { text: '💦', key: m.key } 
        })

        // ========== ENVIAR VIDEO ==========
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: text,
            gifPlayback: true,
            mentions: isAlone ? [m.sender] : [m.sender, victim]
        }, { quoted: m })

        console.log('✅ Comando ejecutado correctamente')

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