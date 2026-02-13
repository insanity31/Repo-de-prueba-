import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. OBTENCIÓN MANUAL DEL CITADO (Directo de la estructura de Baileys)
        // Buscamos el mensaje citado incluso si smsg falló
        let quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo : null
        let victim = m.quoted ? m.quoted.sender : (m.msg?.contextInfo?.participant || null)
        
        // 2. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Si hay una víctima detectada y NO soy yo mismo
        if (victim && victim !== m.sender) {
            isAlone = false
            // Intentamos sacar el nombre, si no, el número
            targetName = m.quoted?.pushName || `@${victim.split('@')[0]}`
        } else {
            targetName = 'sí mismo'
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO
        let txt = isAlone 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 5. VIDEO
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
