import axios from 'axios'

export const run = async (m, { conn, who }) => {
    try {
        // 1. Nombres: nameSender (tú), targetName (el otro)
        let nameSender = m.pushName || 'Usuario'
        
        // 2. DETECCIÓN POR PRESENCIA
        let esSobreOtro = false
        let targetName = 'sí mismo'
        let targetJid = m.sender

        if (m.quoted) {
            esSobreOtro = true
            targetJid = m.quoted.sender
            targetName = m.quoted.pushName || `@${targetJid.split('@')[0]}`
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            esSobreOtro = true
            targetJid = m.mentionedJid[0]
            targetName = `@${targetJid.split('@')[0]}`
        }

        // 3. Reacción
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO CON FORMATO DE CÓDIGO (Uso de ` `)
        let txt = esSobreOtro 
            ? `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`
            : `\`${nameSender}\` se vino solo... 🥑`

        // 5. Envío del video
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, targetJid] 
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
