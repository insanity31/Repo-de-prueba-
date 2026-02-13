import axios from 'axios'

// --- FUNCIONES DE SOPORTE PARA DETECCIÓN (LID & JID) ---
const normalizeJid = (jid) => {
    if (typeof jid !== 'string') return ''
    return jid.toLowerCase().trim()
}

const getDecodeJid = (conn) => (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
        const decode = jid.match(/(\d+):(\d+)@/gi)
        if (decode) return decode[0].split(':')[0] + '@s.whatsapp.net'
    }
    return jid
}

async function resolveLidToPnJid(conn, chatJid, candidateJid) {
    const jid = normalizeJid(candidateJid)
    if (!jid || !jid.endsWith('@lid')) return jid
    if (!chatJid || !String(chatJid).endsWith('@g.us')) return jid
    
    try {
        const meta = await conn.groupMetadata(chatJid).catch(() => null)
        const participants = Array.isArray(meta?.participants) ? meta.participants : []
        const found = participants.find(p => 
            normalizeJid(p?.id) === jid || normalizeJid(p?.lid) === jid
        )
        return found?.id || jid
    } catch { return jid }
}

export const run = async (m, { conn }) => {
    try {
        const decodeJid = getDecodeJid(conn)
        const chatJid = decodeJid(m.chat)

        // 1. OBTENCIÓN DEL OBJETIVO USANDO TU LÓGICA AVANZADA
        let victim = ''
        const ctx = m?.message?.extendedTextMessage?.contextInfo || m?.msg?.contextInfo || {}
        const mentioned = m?.mentionedJid || ctx?.mentionedJid || []

        if (mentioned.length > 0) {
            victim = await resolveLidToPnJid(conn, chatJid, decodeJid(mentioned[0]))
        } else if (m.quoted) {
            victim = await resolveLidToPnJid(conn, chatJid, decodeJid(m.quoted.sender))
        } else if (ctx?.participant) {
            victim = await resolveLidToPnJid(conn, chatJid, decodeJid(ctx.participant))
        }

        // 2. NORMALIZACIÓN PARA COMPARACIÓN
        const cleanId = (jid) => jid ? jid.split('@')[0].split(':')[0] : null
        const selfClean = cleanId(m.sender)
        const targetClean = cleanId(victim)
        const isAlone = !victim || selfClean === targetClean

        // 3. OBTENCIÓN DE NOMBRES
        const getName = async (jid) => {
            if (!jid) return null
            const jidClean = decodeJid(jid)
            // Intentar pushName del citado primero (es lo más rápido)
            if (m.quoted && decodeJid(m.quoted.sender) === jidClean && m.quoted.pushName) {
                return m.quoted.pushName
            }
            // Intentar buscar en contactos de la conexión
            const contact = conn.contacts?.[jidClean]
            if (contact?.name || contact?.notify) return contact.name || contact.notify
            return jidClean.split('@')[0]
        }

        const nameSender = m.pushName || await getName(m.sender) || 'Usuario'
        const targetName = isAlone ? null : await getName(victim)

        // 4. ACCIÓN Y REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        let txt = isAlone 
            ? `\`${nameSender}\` se vino solo... 🥑` 
            : `💦 ¡Uff! \`${nameSender}\` se ha venido sobre \`${targetName}\`!`

        // 5. VIDEO
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, victim].filter(Boolean) 
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
