import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        console.log('========== INICIO CUM ==========')
        console.log('📋 m.quoted:', m.quoted ? 'SÍ' : 'NO')
        console.log('📋 m.quoted?.sender:', m.quoted?.sender)
        console.log('📋 m.quoted?.pushName:', m.quoted?.pushName)
        console.log('📋 m.message:', JSON.stringify(m.message, null, 2))

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimLID = null
        let victimJID = null
        let victimName = ''
        
        // 1. Revisar si hay mención
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            victimLID = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
            console.log('✅ LID detectado desde mención:', victimLID)
        }
        // 2. Mensaje citado - MEJORADO
        else if (m.quoted) {
            console.log('🔍 Analizando mensaje citado...')
            
            // Intentar obtener el sender del quoted
            victimJID = m.quoted.sender 
                || m.message?.extendedTextMessage?.contextInfo?.participant
                || null
                
            victimName = m.quoted.pushName || ''
            
            console.log('✅ JID detectado desde quote:', victimJID)
            console.log('✅ Nombre desde quote:', victimName)
            
            // Si el JID es un LID, marcarlo para conversión
            if (victimJID && victimJID.endsWith('@lid')) {
                console.log('⚠️ El quoted sender es un LID, se convertirá')
                victimLID = victimJID
                victimJID = null
                victimName = ''
            }
        }

        // ========== SI HAY LID, CONVERTIR A JID Y OBTENER NOMBRE ==========
        if (victimLID && victimLID.endsWith('@lid') && m.isGroup) {
            console.log('⚠️ Convirtiendo LID a JID...')
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => p.lid === victimLID)
                
                if (participant) {
                    victimJID = participant.jid || participant.id
                    
                    // Si no tenemos nombre del quote, buscarlo en metadata
                    if (!victimName) {
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || ''
                    }
                    
                    console.log('✅ JID obtenido:', victimJID)
                    console.log('✅ Nombre obtenido:', victimName || '(sin nombre)')
                } else {
                    console.log('❌ LID no encontrado en participantes')
                    return m.reply('⚠️ No pude encontrar a ese usuario')
                }
            } catch (err) {
                console.log('❌ Error:', err.message)
                return m.reply('⚠️ Error obteniendo información del grupo')
            }
        }

        // ========== VALIDAR ==========
        if (!victimJID) {
            console.log('⚠️ No hay víctima, está solo')
        }

        const getNum = (jid) => jid?.split('@')[0].replace(/:\d+/g, '')
        const senderNum = getNum(m.sender)
        const victimNum = getNum(victimJID)

        const isAlone = !victimJID || senderNum === victimNum

        console.log('Sender:', senderNum)
        console.log('Victim:', victimNum)
        console.log('¿Solo?:', isAlone)

        // ========== NOMBRE FINAL ==========
        const senderName = m.pushName || 'Usuario'
        
        if (!isAlone && !victimName) {
            victimName = `@${victimNum}`
        }

        console.log('Nombre final de víctima:', victimName)

        // ========== TEXTO ==========
        const text = isAlone
            ? `*${senderName}* se vino solo... 🥑`
            : `💦 ¡Uff! *${senderName}* se ha venido sobre *${victimName}*!`

        console.log('📝 Texto:', text)
        console.log('========== FIN DEBUG ==========')

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
            mentions: isAlone ? [m.sender] : [m.sender, victimJID]
        }, { quoted: m })

        console.log('✅ Comando ejecutado correctamente')

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