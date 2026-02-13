import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Identificar IDs y limpiar el rastro de dispositivos (:1, :2, etc.)
        const sender = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        let who = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : (m.quoted ? m.quoted.sender : sender)
        
        // Limpiamos la ID del objetivo también
        who = who.split('@')[0].split(':')[0] + '@s.whatsapp.net'

        // 2. Nombres
        let nameSender = m.pushName || 'Usuario'
        let targetName
        
        // 3. Lógica de detección corregida
        if (who === sender) {
            targetName = 'sí mismo'
        } else {
            // Si respondes a alguien, intentamos su pushName, si no, su número mención
            targetName = (m.quoted && m.quoted.sender === who ? m.quoted.pushName : null) || `@${who.split('@')[0]}`
        }

        // Reacción
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. Construcción del texto
        let txt = who === sender 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 5. Envío del video
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['venirse'],
    group: true 
}
