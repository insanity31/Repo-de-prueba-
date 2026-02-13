import axios from 'axios'

// --- FUNCIONES DE APOYO ---
const normalizeJid = (jid) => (typeof jid === 'string' ? jid.toLowerCase().trim() : '')

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
    try {
        const meta = await conn.groupMetadata(chatJid).catch(() => null)
        const found = (meta?.participants || []).find(p => 
            normalizeJid(p?.id) === jid || normalizeJid(p?.lid) === jid
        )
        return found?.id || jid
    } catch { return jid }
}

export const run = async (m, { conn, db }) => {
    try {
        // 1. Verificación de NSFW (Basado en tu código anterior)
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw on*`);
        }

        const decodeJid = getDecodeJid(conn)
        const chatJid = decodeJid(m.chat)

        // 2. DETECCIÓN AVANZADA DEL OBJETIVO
        let victimJid = ''
        const ctx = m?.message?.extendedTextMessage?.contextInfo || m?.msg?.contextInfo || {}
        
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            victimJid = await resolveLidToPnJid(conn, chatJid, decodeJid(m.mentionedJid[0]))
        } else if (m.quoted) {
            victimJid = await resolveLidToPnJid(conn, chatJid, decodeJid(m.quoted.sender))
        }

        // 3. PROCESAMIENTO DE NOMBRES
        const cleaner = (id) => id ? id.split('@')[0].split(':')[0] : null
        const selfClean = cleaner(m.sender)
        const targetClean = cleaner(victimJid)

        let name2 = m.pushName || conn.getName(m.sender) || 'Usuario'
        let name = 'Usuario'
        let str = ''

        if (victimJid && targetClean !== selfClean) {
            name = m.quoted?.pushName || conn.getName(victimJid) || 'Usuario'
            str = `\`${name2}\` *se vino dentro de* \`${name}\`. 💦`
        } else {
            str = `\`${name2}\` *se vino solo...* 🥑`
        }

        // 4. SELECCIÓN DE VIDEO ALEATORIO
        const videos = [
            'https://telegra.ph/file/9243544e7ab350ce747d7.mp4',
            'https://telegra.ph/file/fadc180ae9c212e2bd3e1.mp4',
            'https://telegra.ph/file/79a5a0042dd8c44754942.mp4',
            'https://telegra.ph/file/035e84b8767a9f1ac070b.mp4',
            'https://telegra.ph/file/0103144b636efcbdc069b.mp4',
            'https://telegra.ph/file/4d97457142dff96a3f382.mp4',
            'https://telegra.ph/file/b1b4c9f48eaae4a79ae0e.mp4',
            'https://telegra.ph/file/5094ac53709aa11683a54.mp4',
            'https://telegra.ph/file/dc279553e1ccfec6783f3.mp4',
            'https://telegra.ph/file/acdb5c2703ee8390aaf33.mp4'
        ]
        const video = videos[Math.floor(Math.random() * videos.length)]

        // 5. REACCIÓN Y ENVÍO
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })
        
        await conn.sendMessage(m.chat, { 
            video: { url: video }, 
            caption: str, 
            gifPlayback: true,
            mentions: [m.sender, victimJid].filter(v => v)
        }, { quoted: m })

    } catch (e) {
        console.error("ERROR EN CUM:", e)
    }
}

// CONFIGURACIÓN PARA EL HANDLER
export const config = {
    name: 'cum',
    alias: ['leche', 'venirse'],
    group: true,
    nsfw: true
}
