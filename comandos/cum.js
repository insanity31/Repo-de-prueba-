import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        console.log('========== INICIO CUM ==========')

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimLID = null
        let victimJID = null
        let victimName = ''
        
        // 1. Revisar si hay mención
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            victimLID = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
            console.log('✅ LID detectado desde mención:', victimLID)
        }
        // 2. Mensaje citado
        else if (m.quoted?.sender) {
            victimJID = m.quoted.sender
            victimName = m.quoted.pushName || '' // Ya tenemos el nombre!
            console.log('✅ JID detectado desde quote:', victimJID)
            console.log('✅ Nombre desde quote:', victimName)
        }

        // ========== SI HAY LID, CONVERTIR A JID Y OBTENER NOMBRE ==========
        if (victimLID && victimLID.endsWith('@lid') && m.isGroup) {
            console.log('⚠️ Convirtiendo LID a JID...')
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => p.lid === victimLID)
                
                if (participant) {
                    victimJID = participant.jid || participant.id
                    // 🔥 PRIORIDAD: notify > name > verifiedName > número
                    victimName = participant.notify 
                        || participant.name 
                        || participant.verifiedName 
                        || ''
                    
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
        
        // Si no tenemos nombre aún, usar el número
        if (!isAlone && !victimName) {
            victimName = `+${victimNum}`
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