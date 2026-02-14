import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 1. RESTRICCIÓN NSFW (Basada en tu comando #enable nsfw)
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 2. OBTENCIÓN DEL OBJETIVO (Mención > Citado > Contexto)
        let victim = null
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } else if (m.quoted) {
            victim = m.quoted.sender
        } else {
            victim = m.msg?.contextInfo?.participant || null
        }
        
        // 3. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpieza de IDs para comparar (evita errores de multidispositivo :1)
        const self = m.sender.split('@')[0].split(':')[0]
        const target = victim ? victim.split('@')[0].split(':')[0] : null

        if (target && target !== self) {
            isAlone = false
            // Intentamos sacar el nombre, si no, el número limpio
            targetName = (m.quoted && m.quoted.pushName) ? m.quoted.pushName : (conn.getName ? conn.getName(victim) : `@${target}`)
            
            // Si el nombre sigue trayendo el JID, lo limpiamos
            if (targetName.includes('@')) targetName = targetName.split('@')[0]
        }

        // 4. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. TEXTO CON FORMATO
        let txt = isAlone 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `💦 ¡Uff! *${nameSender}* se ha venido sobre *${targetName}*!`

        // 6. ENVÍO DE VIDEO
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
    alias: ['correrse', 'leche', 'venirse'],
    group: true 
}
