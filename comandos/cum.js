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

        console.log('🎯 DETECCIÓN:')
        console.log('Sender:', m.sender)
        console.log('Victim:', victim)

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

        if (!isAlone && m.isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => p.id === victim)
                
                // Prioridad: notify > name > número
                victimName = participant?.notify || participant?.name || `Usuario ${victimNumber.slice(-4)}`
                
                console.log('Nombre víctima:', victimName)
            } catch (err) {
                console.log('Error obteniendo metadata:', err)
                victimName = `Usuario ${victimNumber.slice(-4)}`
            }
        }

        // ========== CONSTRUIR MENSAJE ==========
        const text = isAlone 
            ? `*${senderName}* se vino solo... 🥑`
            : `💦 ¡Uff! *${senderName}* se ha venido sobre *${victimName}*!`

        console.log('Texto final:', text)

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