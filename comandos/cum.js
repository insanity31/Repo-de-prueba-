import axios from 'axios'

export const run = async (m, { conn, db, who }) => {
    try {
        // 1. Verificación de NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``);
        }

        // 2. FORZAR DETECCIÓN DE OBJETIVO
        let targetJid = who
        
        // Si 'who' dice que soy yo, pero hay una mención escrita en el texto, la extraemos
        if (targetJid === m.sender) {
            const text = m.text || m.body || ''
            const extractMention = text.match(/@(\d+)/)
            if (extractMention) {
                targetJid = extractMention[1] + '@s.whatsapp.net'
            }
        }

        // 3. LÓGICA DE NOMBRES
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        const selfId = m.sender.split('@')[0].split(':')[0]
        const finalTargetId = targetJid.split('@')[0].split(':')[0]

        if (finalTargetId !== selfId) {
            isAlone = false
            // Intentar obtener el nombre sin romper el bot
            try {
                targetName = (m.quoted && m.quoted.sender === targetJid) 
                    ? m.quoted.pushName 
                    : (conn.getName ? conn.getName(targetJid) : finalTargetId)
            } catch {
                targetName = finalTargetId
            }
            
            // Limpieza por si sale el JID completo
            if (targetName.toString().includes('@')) targetName = finalTargetId
        }

        // 4. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. TEXTO FINAL
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 6. ENVÍO DE VIDEO
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, targetJid].filter(Boolean) 
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['leche', 'correrse'],
    group: true 
}
