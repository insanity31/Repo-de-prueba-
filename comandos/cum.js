import axios from 'axios'

// Helper para limpiar IDs (No requiere imports externos si lo definimos aquí)
const clean = (jid) => jid ? jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

export const run = async (m, { conn }) => {
    try {
        // 1. LÓGICA DE DETECCIÓN AVANZADA (Basada en lo que pasaste)
        const ctx = m?.message?.extendedTextMessage?.contextInfo || m?.msg?.contextInfo || {}
        
        // Prioridad 1: Menciones directas
        let victim = m?.mentionedJid?.[0] || ctx?.mentionedJid?.[0]
        
        // Prioridad 2: Si no hay mención, buscamos el citado (quoted)
        if (!victim) {
            victim = m?.quoted?.sender || ctx?.participant || m?.msg?.contextInfo?.participant
        }

        // 2. PROCESAMIENTO DE IDENTIDADES
        const senderActual = clean(m.sender)
        const targetActual = victim ? clean(victim) : null

        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Solo es "sobre otro" si hay víctima y no soy yo mismo
        if (targetActual && targetActual !== senderActual) {
            isAlone = false
            // Intentamos sacar el nombre del citado, si no, usamos el número
            targetName = m.quoted?.pushName || `@${targetActual.split('@')[0]}`
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
        console.error("ERROR EN CUM (ADVANCED):", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}
