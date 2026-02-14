import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // ========== DETECCIÓN DE VÍCTIMA ==========
        let victimJID = null
        let victimName = ''

        const mentions = m.mentionedJid || []
        const quotedSender = m.quoted?.sender

        if (mentions.length > 0) {
            victimJID = mentions[0]
        } else if (quotedSender) {
            victimJID = quotedSender
            victimName = m.quoted?.pushName || ''
        }

        // ========== CONVERSIÓN DE LID A JID ==========
        if (victimJID && victimJID.includes('@lid') && m.isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const participant = groupMeta.participants.find(p => 
                    p.lid === victimJID || p.id === victimJID
                )
                if (participant) {
                    victimJID = participant.jid || participant.id
                    if (!victimName) {
                        victimName = participant.notify || participant.name || ''
                    }
                }
            } catch (err) {
                console.log('Error LID:', err.message)
            }
        }

        // ========== LIMPIAR NÚMEROS (Anti-Multidispositivo) ==========
        const cleanNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
        }

        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victimJID)

        // ========== VALIDAR SI ESTÁ SOLO ==========
        const isAlone = !victimJID || senderNum === victimNum

        // ========== OBTENER NOMBRES ==========
        const senderName = m.pushName || db.users?.[m.sender]?.name || 'Usuario'

        if (!isAlone && !victimName) {
            try {
                if (conn.contacts && conn.contacts[victimJID]) {
                    victimName = conn.contacts[victimJID].notify || conn.contacts[victimJID].name || ''
                }
                if (!victimName && db.users?.[victimJID]) {
                    victimName = db.users[victimJID].name || ''
                }
                if (!victimName && typeof conn.getName === 'function') {
                    victimName = await conn.getName(victimJID)
                }
            } catch {}
        }

        if (!isAlone && (!victimName || victimName.includes('@'))) {
            victimName = victimNum || 'Usuario'
        }

        // ========== FORMATO Y REACCIÓN ==========
        const text = isAlone
            ? `\`${senderName}\` se vino solo... 🥑`
            : `💦 ¡Uff! \`${senderName}\` se ha venido sobre \`${victimName}\`!`

        await m.react('💦')

        // ========== ENVÍO BLINDADO (Buffer con respaldo de URL) ==========
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4'
        
        try {
            // Intento 1: Descarga manual (Evita errores de timeout de Baileys)
            const { data } = await axios.get(videoUrl, { 
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' } 
            })

            await conn.sendMessage(m.chat, {
                video: Buffer.from(data),
                mimetype: 'video/mp4',
                caption: text,
                gifPlayback: true,
                mentions: isAlone ? [] : [victimJID]
            }, { quoted: m })

        } catch (error) {
            console.log("Fallo descarga, intentando por URL directa...")
            // Intento 2: Por URL si la descarga falla
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption: text,
                gifPlayback: true,
                mentions: isAlone ? [] : [victimJID]
            }, { quoted: m })
        }

    } catch (e) {
        console.error('❌ ERROR EN CUM:', e)
        m.reply('⚠️ El servicio de videos no está disponible en este momento.')
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse'],
    description: 'Comando NSFW',
    group: true
}
