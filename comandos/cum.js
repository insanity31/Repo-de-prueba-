import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. OBTENCIÓN DEL OBJETIVO
        let victim = null
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } else if (m.quoted) {
            victim = m.quoted.sender
        } else {
            victim = m.msg?.contextInfo?.participant || null
        }

        // 2. LÓGICA DE DETECCIÓN Y NOMBRES
        let nameSender = m.pushName || conn.getName(m.sender) || 'Usuario'
        let targetName = ''
        let isAlone = true

        const self = m.sender.split('@')[0].split(':')[0]
        const targetId = victim ? victim.split('@')[0].split(':')[0] : null

        if (targetId && targetId !== self) {
            isAlone = false
            
            // --- AQUÍ CONSEGUIMOS EL NOMBRE SIN NÚMEROS ---
            // 1. Si es citado, el pushName suele estar disponible
            // 2. Si no, usamos conn.getName para buscarlo en la base de datos del bot
            targetName = (m.quoted && m.quoted.sender === victim && m.quoted.pushName) 
                ? m.quoted.pushName 
                : conn.getName(victim)
            
            // Si conn.getName devuelve el número (porque no hay nombre), limpiamos el @s.whatsapp...
            if (targetName.includes('@')) targetName = targetName.split('@')[0]
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO FORMATEADO
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
    alias: ['correrse', 'leche'],
    group: true 
}
