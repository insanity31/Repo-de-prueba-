import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
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
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || ''
                    }
                }
            } catch {}
        }

        // ========== LIMPIAR NÚMEROS ==========
        const cleanNumber = (jid) => {
            if (!jid) return null
            return jid.split('@')[0].replace(/:\d+/g, '')
        }

        const senderNum = cleanNumber(m.sender)
        const victimNum = cleanNumber(victimJID)

        // ========== VALIDAR SI ESTÁ SOLO ==========
        const isAlone = !victimJID || senderNum === victimNum

        // ========== OBTENER NOMBRES ==========
        const senderName = m.pushName || db.users?.[m.sender]?.name || 'Usuario'
        
        if (!isAlone && !victimName) {
            try {
                // Store de contactos
                if (conn.contacts) {
                    const contact = conn.contacts[victimJID]
                    if (contact) {
                        victimName = contact.notify 
                            || contact.name 
                            || contact.verifiedName 
                            || ''
                    }
                }
                
                // Base de datos local
                if (!victimName && db.users?.[victimJID]) {
                    victimName = db.users[victimJID].name || ''
                }
                
                // Metadata del grupo
                if (!victimName && m.isGroup) {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    const participant = groupMeta.participants.find(p => 
                        cleanNumber(p.id) === victimNum
                    )
                    
                    if (participant) {
                        victimName = participant.notify 
                            || participant.name 
                            || participant.verifiedName 
                            || ''
                    }
                }

                // getName API
                if (!victimName && typeof conn.getName === 'function') {
                    try {
                        const name = await conn.getName(victimJID)
                        if (name && !name.includes('+') && !/^\d+$/.test(name)) {
                            victimName = name
                        }
                    } catch {}
                }
            } catch {}
        }

        // Fallback
        if (!isAlone && !victimName) {
            victimName = 'Usuario'
        }

        // ========== FORMATO CON BACKTICKS ==========
        const text = isAlone
            ? `\`${senderName}\` se besó a sí mismo/a ( ˘ ³˘)♥`
            : `\`${senderName}\` besó a \`${victimName}\` ( ˘ ³˘)♥`

        // ========== VIDEOS ALEATORIOS ==========
        const videos = [
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784879173.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784874988.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784869583.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784864195.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784856547.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784908581.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784904437.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784899621.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784894649.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784889479.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784945508.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784940220.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784935466.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784918972.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784914086.mp4'
        ]

        const videoUrl = videos[Math.floor(Math.random() * videos.length)]

        // ========== REACCIÓN ==========
        await m.react('💋')

        // ========== ENVIAR VIDEO ==========
        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            gifPlayback: true,
            caption: text,
            mentions: isAlone ? [] : [victimJID]
        }, { quoted: m })

    } catch (e) {
        console.error('❌ ERROR EN KISS:', e)
        m.reply('⚠️ Ocurrió un error al ejecutar el comando')
    }
}

export const config = {
    name: 'kiss',
    alias: ['besar'],
    description: 'Besa a alguien con un gif romántico',
    group: true
}