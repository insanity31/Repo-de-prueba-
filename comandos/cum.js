import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. OBTENCIÓN DEL OBJETIVO (Mención @user o mensaje citado)
        let victim = (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : (m.msg?.contextInfo?.participant || null));
        
        // 2. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // --- LIMPIEZA TOTAL DE IDs (Esto arregla el error) ---
        // Extraemos solo los números de los JIDs para comparar sin errores
        const senderNum = m.sender.split('@')[0].split(':')[0]
        const victimNum = victim ? victim.split('@')[0].split(':')[0] : null

        // Si hay una víctima y el número NO es el mismo que el mío
        if (victimNum && victimNum !== senderNum) {
            isAlone = false
            // Sacamos el nombre limpio
            targetName = m.quoted?.pushName || conn.getName(victim) || `@${victimNum}`
            if (targetName.includes('@')) targetName = victimNum // Fallback por si getName falla
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
