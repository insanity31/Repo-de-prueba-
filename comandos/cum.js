import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. OBTENCIÓN DE DATOS CRUDA
        // Forzamos la obtención del remitente del mensaje citado si existe
        let quotedUser = m.quoted ? m.quoted.sender : null
        let mentionedUser = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null
        
        // 2. DETERMINAR OBJETIVO (Prioridad absoluta al citado)
        let who = quotedUser || mentionedUser || m.sender
        
        // 3. LIMPIEZA DE JIDS (Quitar el :1 de dispositivos)
        const limpiar = (jid) => jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        
        const senderActual = limpiar(m.sender)
        const targetActual = limpiar(who)

        // 4. LOGICA DE NOMBRES
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''

        if (targetActual === senderActual && !m.quoted) {
            // SOLO si no hay respuesta y la ID es la misma, se vino solo
            targetName = 'sí mismo'
        } else {
            // Si hay respuesta, intentamos sacar el nombre del citado directamente del objeto
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : `@${targetActual.split('@')[0]}`
        }

        // 5. CONSTRUCCIÓN DEL TEXTO
        let txt = (targetActual === senderActual && !m.quoted) 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // Reacción
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 6. ENVÍO DE VIDEO
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, targetActual] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
        m.reply(`❌ Error técnico: ${e.message}`)
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
