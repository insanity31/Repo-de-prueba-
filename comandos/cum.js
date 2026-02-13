import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. OBTENCIÓN MANUAL (Lo que te funcionó antes)
        let victim = m.quoted ? m.quoted.sender : (m.msg?.contextInfo?.participant || null)
        
        // 2. LÓGICA DE DETECCIÓN DE "SOLO" O "ACOMPAÑADO"
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpiamos los IDs para comparar (evita fallos de :1 o @lid)
        const self = m.sender.split('@')[0].split(':')[0]
        const target = victim ? victim.split('@')[0].split(':')[0] : null

        if (target && target !== self) {
            isAlone = false
            // Intentamos sacar el nombre del citado, si no, el número
            targetName = m.quoted?.pushName || (victim ? victim.split('@')[0] : 'alguien')
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO CON FORMATO ` `
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. ENVÍO DE VIDEO
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
