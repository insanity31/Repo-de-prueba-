import axios from 'axios'

export const run = async (m, { conn, db, who }) => {
    try {
        // 1. Verificación de NSFW
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``);
        }

        // 2. LÓGICA DE NOMBRES USANDO 'WHO'
        // 'who' ya contiene la mención o el citado gracias a tu Handler
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpieza de IDs para comparar
        const self = m.sender.split('@')[0]
        const target = who.split('@')[0]

        if (target !== self) {
            isAlone = false
            // Intentamos sacar el nombre del objetivo
            // Prioridad: pushName del citado > nombre en contactos > número
            targetName = (m.quoted && m.quoted.sender === who) ? m.quoted.pushName : (conn.getName ? conn.getName(who) : target)
            
            // Si el nombre sigue siendo el JID, dejamos solo el número
            if (targetName.includes('@')) targetName = targetName.split('@')[0]
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
            mentions: [m.sender, who].filter(Boolean) 
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
