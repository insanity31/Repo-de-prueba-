import axios from 'axios'

// Helper para limpiar IDs y evitar errores de comparación (:1, :2, @lid, etc.)
const cleanJid = (jid) => jid ? jid.split('@')[0].split(':')[0] : ''

export const run = async (m, { conn, db }) => {
    try {
        // 0. Verificación de NSFW (Usando tu base de datos)
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Actívalo con: \`.enable nsfw on\``)
        }

        // 1. OBTENCIÓN DEL OBJETIVO
        const ctx = m?.message?.extendedTextMessage?.contextInfo || m?.msg?.contextInfo || {}
        
        // Prioridad: Mención (@user) > Citado (reply) > Contexto
        let victim = null
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } else if (m.quoted) {
            victim = m.quoted.sender
        } else if (ctx?.participant) {
            victim = ctx.participant
        }

        // 2. PROCESAMIENTO DE IDENTIDADES
        const senderId = cleanJid(m.sender)
        const targetId = victim ? cleanJid(victim) : null

        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Solo es "sobre otro" si hay víctima y no soy yo mismo
        if (targetId && targetId !== senderId) {
            isAlone = false
            // Intentamos sacar el nombre: Pushname del citado > Nombre en contactos > Número limpio
            targetName = (m.quoted && m.quoted.sender === victim) ? m.quoted.pushName : (conn.getName ? conn.getName(victim) : `@${targetId}`)
            
            // Si el nombre sigue pareciendo un JID, dejamos solo el número
            if (targetName.includes('@')) targetName = targetId
        }

        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 4. TEXTO CON FORMATO ` `
        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. ENVÍO DE VIDEO (Catbox)
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
    alias: ['leche', 'correrse'],
    group: true 
}
