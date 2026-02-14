import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. OBTENCIÓN DEL OBJETIVO (Mención, Texto o Citado)
        let victim = null
        
        // A. Intentar por mención oficial
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } 
        // B. Intentar por búsqueda manual en el texto (Si el handler falla)
        else {
            const text = m.text || m.body || ''
            const extract = text.match(/@(\d+)/)
            if (extract) victim = extract[1] + '@s.whatsapp.net'
        }
        // C. Intentar por mensaje citado
        if (!victim && m.quoted) {
            victim = m.quoted.sender
        }

        // 2. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpieza extrema de números
        const senderNum = m.sender.replace(/[^0-9]/g, '')
        const victimNum = victim ? victim.replace(/[^0-9]/g, '') : null

        if (victimNum && victimNum !== senderNum) {
            isAlone = false
            // Intentar sacar nombre, si no, usar el número limpio
            const contactName = conn.getName ? conn.getName(victim) : null
            targetName = m.quoted?.pushName || (contactName && !contactName.includes('@') ? contactName : `@${victimNum}`)
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
