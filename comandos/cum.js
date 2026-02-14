import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        console.log('========== DEBUG COMPLETO ==========')

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimJID = null
        let victimName = ''
        
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        const quotedSender = m.quoted?.sender
        
        if (mentions.length > 0) {
            victimJID = mentions[0]
            console.log('✅ Detectado por MENCIÓN:', victimJID)
        } else if (quotedParticipant) {
            victimJID = quotedParticipant
            victimName = m.quoted?.pushName || ''
            console.log('✅ Detectado por QUOTED PARTICIPANT:', victimJID)
            console.log('   pushName del quote:', victimName)
        } else if (quotedSender) {
            victimJID = quotedSender
            victimName = m.quoted?.pushName || ''
            console.log('✅ Detectado por QUOTED SENDER:', victimJID)
            console.log('   pushName del quote:', victimName)
        }

        // ========== CONVERSIÓN DE LID ==========
        if (victimJID && victimJID.includes('@lid') && m.isGroup) {
            console.log('⚠️ LID detectado, convirtiendo...')
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => 
                    p.lid === victimJID || p.id === victimJID
                )
                
                if (participant) {
                    console.log('📋 PARTICIPANTE COMPLETO:')
                    console.log(JSON.stringify(participant, null, 2))
                    
                    victimJID = participant.jid || participant.id
                    
                    if (!victimName) {
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName
                            || participant.vname
                            || participant.subject
                            || ''
                        
                        console.log('🔍 Nombres encontrados:')
                        console.log('   notify:', participant.notify)
                        console.log('   name:', participant.name)
                        console.log('   verifiedName:', participant.verifiedName)
                        console.log('   vname:', participant.vname)
                        console.log('   subject:', participant.subject)
                        console.log('   NOMBRE FINAL:', victimName || '(vacío)')
                    }
                }
            } catch (err) {
                console.log('❌ Error:', err.message)
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
        
        // ========== BÚSQUEDA FINAL SI NO HAY NOMBRE ==========
        if (!isAlone && !victimName && m.isGroup) {
            console.log('⚠️ Sin nombre aún, buscando en metadata...')
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => 
                    cleanNumber(p.id) === victimNum || p.lid === victimJID
                )
                
                if (participant) {
                    console.log('📋 PARTICIPANTE ENCONTRADO EN BÚSQUEDA:')
                    console.log(JSON.stringify(participant, null, 2))
                    
                    victimName = participant.notify 
                        || participant.name 
                        || participant.verifiedName
                        || participant.vname
                        || participant.subject
                        || ''
                    
                    console.log('   NOMBRE OBTENIDO:', victimName || '(vacío)')
                }
            } catch (err) {
                console.log('❌ Error en búsqueda:', err.message)
            }
        }

        // Fallback a "Usuario"
        if (!isAlone && !victimName) {
            victimName = 'Usuario'
            console.log('⚠️ Usando fallback: Usuario')
        }

        console.log('========== RESULTADO FINAL ==========')
        console.log('Sender:', senderName)
        console.log('Victim:', victimName)
        console.log('¿Solo?:', isAlone)
        console.log('====================================')

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