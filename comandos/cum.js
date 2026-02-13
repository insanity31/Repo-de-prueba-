import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Forzar la detección del objetivo
        // Primero verificamos si hay una respuesta (quoted) o una mención (@)
        let victim = null
        if (m.quoted) {
            victim = m.quoted.sender
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        }

        // 2. Limpiar IDs para comparar (evitar el error de :1, :2 de dispositivos)
        const cleaner = (jid) => jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        const senderActual = cleaner(m.sender)
        const targetActual = victim ? cleaner(victim) : null

        // 3. Definir nombres
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let esSobreOtro = false

        // Solo es "sobre otro" si hay una víctima y esa víctima no soy yo mismo
        if (targetActual && targetActual !== senderActual) {
            esSobreOtro = true
            targetName = m.quoted?.pushName || `@${targetActual.split('@')[0]}`
        }

        // 4. Reacción
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. Texto con formato ` `
        let txt = esSobreOtro 
            ? `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`
            : `\`${nameSender}\` se vino solo... 🥑`

        // 6. Envío del video
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, victim].filter(v => v) 
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
