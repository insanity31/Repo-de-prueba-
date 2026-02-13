import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Lógica Forzada: ¿A quién va dirigido?
        let who
        if (m.quoted) {
            // Si respondes a un mensaje, EL OBJETIVO ES EL DUEÑO DE ESE MENSAJE
            who = m.quoted.sender
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            // Si mencionas a alguien con @, el objetivo es el mencionado
            who = m.mentionedJid[0]
        } else {
            // Si no hay respuesta ni mención, es uno mismo
            who = m.sender
        }

        // 2. Limpiar ID para evitar el error del ":1" (dispositivos)
        const realSender = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        const realTarget = who.split('@')[0].split(':')[0] + '@s.whatsapp.net'

        // 3. Definir nombres
        let nameSender = m.pushName || 'Usuario'
        let targetName
        
        // 4. Comparación final para el texto
        if (realTarget === realSender) {
            targetName = 'sí mismo'
        } else {
            // Intentamos sacar el nombre del citado, si no, usamos mención
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : `@${realTarget.split('@')[0]}`
        }

        // Reacción manual segura
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. Construir el texto
        let txt = (realTarget === realSender) 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 6. Descargar y enviar video
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, realTarget] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
