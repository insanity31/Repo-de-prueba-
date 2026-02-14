import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victim = null
        
        // 1. Revisar si hay mención en el mensaje
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            victim = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
        }
        // 2. Si no hay mención, revisar si respondió a un mensaje
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            victim = m.message.extendedTextMessage.contextInfo.participant
        }
        // 3. Si respondió a un mensaje (estructura alternativa)
        else if (m.quoted?.sender) {
            victim = m.quoted.sender
        }

        console.log('🎯 DETECCIÓN INICIAL:')
        console.log('Victim original:', victim)

        // ========== CONVERTIR LID A JID ==========
        if (victim && victim.endsWith('@lid') && m.isGroup) {
            console.log('⚠️ LID detectado, convirtiendo a JID...')
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => p.lid === victim)
                
                if (participant?.id) {
                    console.log('✅ LID convertido:', victim, '→', participant.id)
                    victim = participant.id
                } else {
                    console.log('❌ No se pudo convertir LID')
                    victim = null
                }
            } catch (err) {
                console.log('❌ Error convirtiendo LID:', err)
                victim = null
            }
        }

        console.log('Victim final:', victim)

        // ========== LIMPIAR NÚMEROS ==========
        const getNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNumber = getNumber(m.sender)
        const victimNumber = getNumber(victim)

        console.log('Sender Number:', senderNumber)
        console.log('Victim Number:', victimNumber)

        // ========== DETERMINAR SI ESTÁ SOLO ==========
        const isAlone = !victim || !victimNumber || senderNumber === victimNumber

        console.log('¿Está solo?:', isAlone)

        // ========== OBTENER NOMBRES ==========
        const senderName = m.pushName || 'Usuario'
        let victimName = ''

        if (!isAlone) {
            // 🔥 PRIORIDAD 1: Si respondió a un mensaje, usar el pushName del mensaje citado
            if (m.quoted?.pushName) {
                victimName = m.quoted.pushName
                console.log('✅ Nombre desde quoted.pushName:', victimName)
            }
            // 🔥 PRIORIDAD 2: Buscar en metadatos del grupo
            else if (m.isGroup) {
                try {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    
                    // Buscar participante
                    const participant = groupMeta.participants.find(p => {
                        const pNumber = getNumber(p.id)
                        return pNumber === victimNumber
                    })
                    
                    if (participant) {
                        console.log('👤 Participante completo:', JSON.stringify(participant, null, 2))
                        
                        // 🔥 BUSCAR NOMBRE EN ORDEN DE PRIORIDAD
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || participant.pushName
                            || null
                        
                        // Si NO encontró ningún nombre, buscar en el contacto directamente
                        if (!victimName) {
                            console.log('⚠️ Sin nombre en metadata, buscando en contacto...')
                            try {
                                // Método 1: profilePictureUrl puede darnos info
                                const contact = await conn.onWhatsApp(victim)
                                console.log('📱 Contacto info:', contact)
                                
                                if (contact && contact[0]?.notify) {
                                    victimName = contact[0].notify
                                    console.log('✅ Nombre desde onWhatsApp:', victimName)
                                }
                            } catch (err2) {
                                console.log('❌ Error obteniendo contacto:', err2)
                            }
                        }
                        
                        // Fallback final
                        if (!victimName) {
                            victimName = `+${victimNumber}`
                            console.log('⚠️ Usando número como fallback')
                        } else {
                            console.log('✅ Nombre final:', victimName)
                        }
                    } else {
                        console.log('❌ Participante NO encontrado')
                        victimName = `+${victimNumber}`
                    }
                } catch (err) {
                    console.log('❌ Error obteniendo metadata:', err)
                    victimName = `+${victimNumber}`
                }
            }
            // 🔥 PRIORIDAD 3: Chat privado
            else {
                victimName = `+${victimNumber}`
            }
        }

        // ========== CONSTRUIR MENSAJE ==========
        const text = isAlone 
            ? `*${senderName}* se vino solo... 🥑`
            : `💦 ¡Uff! *${senderName}* se ha venido sobre *${victimName}*!`

        console.log('📝 Texto final:', text)

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