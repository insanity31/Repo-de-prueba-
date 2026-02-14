import axios from 'axios'

export const run = async (m, { conn, db, who }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. USAR EL 'who' DEL HANDLER
        let victim = who // Será null si no hay mención/quote

        // 2. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        const cleanNum = (jid) => {
            if (!jid) return ''
            return jid.split('@')[0].replace(/:\d+/g, '').trim()
        }

        const senderNum = cleanNum(m.sender)
        const victimNum = cleanNum(victim)

        // 3. Verificar que victim exista Y sea diferente del sender
        if (victim && victimNum && senderNum && victimNum !== senderNum) {
            isAlone = false
            
            // OBTENER NOMBRE REAL
            if (m.quoted?.pushName) {
                targetName = m.quoted.pushName
            } else if (m.isGroup) {
                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
                const participant = groupMetadata?.participants?.find(p => p.id === victim)
                targetName = participant?.notify || participant?.name || `Usuario ${victimNum.slice(-4)}`
            } else {
                try {
                    const contact = await conn.getContact(victim)
                    targetName = contact?.notify || contact?.name || `Usuario ${victimNum.slice(-4)}`
                } catch {
                    targetName = `Usuario ${victimNum.slice(-4)}`
                }
            }
        }

        // 4. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } })

        // 5. TEXTO
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
            mentions: [m.sender, victim].filter(Boolean)
        }, { quoted: m })

    } catch (e) {
        console.error("❌ ERROR EN CUM:", e)
        m.reply("⚠️ Ocurrió un error al ejecutar el comando")
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    group: true 
}