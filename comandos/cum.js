import axios from 'axios'

export const run = async (m, { conn, who }) => {
    try {
        // 1. Nombres: name2 (tú), targetName (el otro)
        let name2 = m.pushName || 'Usuario'
        
        // Limpiamos las IDs para comparar sin errores de dispositivo (:1)
        const senderId = m.sender.split('@')[0].split(':')[0]
        const targetId = who.split('@')[0].split(':')[0]
        
        let targetName
        if (senderId === targetId) {
            targetName = 'sí mismo'
        } else {
            // Si el handler detectó un citado, usamos su nombre, si no, su número
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : `@${targetId}`
        }

        // 2. Reacción de gotitas
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 3. Texto dinámico
        let txt = (senderId === targetId) 
            ? `*${name2}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${name2}* se ha venido sobre *${targetName}*!`

        // 4. Descargar y enviar video
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
    alias: ['correrse', 'venirse'],
    group: true 
}
