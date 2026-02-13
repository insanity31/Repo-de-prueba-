import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 1. Verificación de NSFW basada en la base de datos
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 2. DETECCIÓN DEL OBJETIVO
        // Usamos directamente las propiedades que vienen en 'm' procesadas por tu handler
        let victimJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)

        // 3. PROCESAMIENTO DE NOMBRES Y COMPARACIÓN
        const cleaner = (id) => id ? id.split('@')[0].split(':')[0] : null
        const selfClean = cleaner(m.sender)
        const targetClean = cleaner(victimJid)

        let nameSender = m.pushName || conn.getName(m.sender) || 'Usuario'
        let nameVictim = 'Usuario'
        let str = ''

        if (victimJid && targetClean !== selfClean) {
            nameVictim = m.quoted?.pushName || conn.getName(victimJid) || 'Usuario'
            str = `\`${nameSender}\` *se vino dentro de* \`${nameVictim}\`. 💦`
        } else {
            str = `\`${nameSender}\` *se vino solo...* 🥑`
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
        console.error("❌ ERROR EN CUM:", e)
    }
}

export const config = {
    name: 'cum',
    alias: ['leche', 'venirse'],
    group: true,
    nsfw: true
}
