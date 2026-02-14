import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // --- RESTRICCIÓN NSFW ---
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        // 1. OBTENCIÓN DEL OBJETIVO
        let victim = null
        if (m.mentionedJid && m.mentionedJid[0]) {
            victim = m.mentionedJid[0]
        } else if (m.quoted?.sender) {
            victim = m.quoted.sender
        }

        // 🔍 DEBUG: Ver qué se está capturando
        console.log('🔍 DEBUG CUM:')
        console.log('m.sender:', m.sender)
        console.log('victim original:', victim)
        console.log('m.quoted?.sender:', m.quoted?.sender)
        console.log('m.mentionedJid:', m.mentionedJid)

        // --- CONVERSIÓN DE LID A JID (Solo en grupos) ---
        if (victim && victim.endsWith('@lid') && m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
            const participant = groupMetadata?.participants?.find(p => 
                p.lid === victim || p.id === victim
            )
            if (participant?.id) {
                console.log('✅ LID convertido a JID:', participant.id)
                victim = participant.id
            } else {
                console.log('❌ No se pudo convertir LID')
                victim = null
            }
        }

        // 2. VALIDACIÓN: Asegurar que victim sea JID válido
        if (victim && !victim.endsWith('@s.whatsapp.net') && !victim.endsWith('@lid')) {
            console.log('❌ JID inválido:', victim)
            victim = null
        }

        // 3. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        // Limpieza segura de números
        const cleanNum = (jid) => {
            if (!jid) return ''
            return jid.split('@')[0].replace(/:\d+/g, '').trim()
        }

        const senderNum = cleanNum(m.sender)
        const victimNum = cleanNum(victim)

        console.log('senderNum:', senderNum)
        console.log('victimNum:', victimNum)
        console.log('Son iguales?:', senderNum === victimNum)

        // 🔥 CORRECCIÓN: Verificar que victim exista Y sea diferente
        if (victim && victimNum && senderNum && victimNum !== senderNum) {
            isAlone = false
            
            // OBTENER NOMBRE REAL
            if (m.quoted?.pushName) {
                targetName = m.quoted.pushName
            } else {
                const contactName = conn.getName(victim)
                if (contactName && !contactName.includes('@') && contactName !== victimNum) {
                    targetName = contactName
                } else {
                    if (m.isGroup) {
                        const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
                        const participant = groupMetadata?.participants?.find(p => p.id === victim)
                        targetName = participant?.notify || participant?.name || `Usuario ${victimNum.slice(-4)}`
                    } else {
                        targetName = `Usuario ${victimNum.slice(-4)}`
                    }
                }
            }
        }

        console.log('isAlone:', isAlone)
        console.log('targetName:', targetName)

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