import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Identificar al objetivo (Prioridad: Mención > Respuesta > Uno mismo)
        let who = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : (m.quoted ? m.quoted.sender : m.sender)

        // 2. Extraer nombres de forma segura
        // 'm.pushName' es el nombre de quien envía el comando
        let nameSender = m.pushName || 'Usuario'
        
        // 'targetName' es el nombre de quien recibe
        let targetName
        if (who === m.sender) {
            targetName = 'sí mismo'
        } else if (m.quoted && m.quoted.sender === who) {
            // Intentamos sacar el pushName del mensaje que respondiste
            targetName = m.quoted.pushName || `@${who.split('@')[0]}`
        } else {
            // Si lo mencionaste por @, usamos el número (WhatsApp lo convierte en nombre)
            targetName = `@${who.split('@')[0]}`
        }

        // 3. Reacción (Usando el método seguro que ya probamos)
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. Texto del mensaje
        let txt = who === m.sender 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 5. Descargar y enviar video de Catbox
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
        console.error("ERROR EN CUM (DETECCIÓN):", e)
        // No mandamos m.reply aquí para no interrumpir si falla algo pequeño
    }
}

export const config = {
    name: 'cum',
    alias: ['venirse'],
    group: true 
}
