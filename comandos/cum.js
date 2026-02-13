import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Detectar a quién se le responde o etiqueta
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
        
        // 2. Obtener nombres de forma ultra segura
        // name2: El que escribe el comando
        let name2 = m.pushName || 'Alguien'
        
        // name: El que recibe (si es quoted, intentamos sacar su nombre del mensaje citado)
        let name
        if (who === m.sender) {
            name = 'sí mismo'
        } else if (m.quoted && m.quoted.sender === who) {
            // Si hay respuesta a un mensaje, intentamos usar el pushName de ese mensaje
            name = m.quoted.pushName || `@${who.split('@')[0]}`
        } else {
            name = `@${who.split('@')[0]}`
        }
        
        // 3. Reacción manual segura
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. Texto dinámico
        let str = who === m.sender 
            ? `*${name2}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${name2}* se ha venido sobre *${name}*!`

        // 5. Envío del video
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' })
        
        await conn.sendMessage(m.chat, { 
            video: Buffer.from(response.data), 
            mimetype: 'video/mp4',
            caption: str, 
            gifPlayback: true,
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN DETECCIÓN DE NOMBRE:", e)
        m.reply("💦 ¡Ufff! (Se vino pero hubo un error de nombres)")
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
