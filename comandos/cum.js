import axios from 'axios'

export const run = async (m, { conn }) => {
    try {
        // 1. Identificar objetivo
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
        
        // 2. Nombres ultra-seguros (sin usar funciones externas)
        let name2 = m.pushName || 'Alguien'
        let name = who === m.sender ? 'sí mismo' : `@${who.split('@')[0]}`
        
        // 3. Reacción manual (usando conn en lugar de m.react)
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. Texto del mensaje
        let str = who === m.sender 
            ? `*${name2}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${name2}* se ha venido sobre ${name}!`

        // 5. Descarga y envío del video
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
        console.error("ERROR FINAL EN CUM:", e)
        // Si falla todo, al menos manda el texto
        m.reply("💦 ¡Ufff! (Error al cargar video, pero el sentimiento es el mismo)")
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
