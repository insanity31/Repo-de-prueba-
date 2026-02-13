import axios from 'axios'

// Función para limpiar IDs
const clean = (jid) => jid ? jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' : ''

export const run = async (m, { conn }) => {
    try {
        // 1. OBTENCIÓN DE VÍCTIMA (Prioridad: Citado > Mención)
        let victimJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)
        
        // 2. LÓGICA DE NOMBRES
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        const senderActual = clean(m.sender)
        const targetActual = victimJid ? clean(victimJid) : null

        if (targetActual && targetActual !== senderActual) {
            isAlone = false
            
            // --- AQUÍ ESTÁ EL TRUCO PARA EL NOMBRE ---
            // 1. Intentamos sacar el pushName del mensaje citado (m.quoted)
            // 2. Si no existe, buscamos en los contactos guardados de la conexión
            // 3. Si no, usamos el número limpio
            targetName = m.quoted?.pushName || 
                         conn.contacts[targetActual]?.name || 
                         conn.contacts[targetActual]?.notify || 
                         targetActual.split('@')[0]
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
            mentions: [m.sender, victimJid].filter(v => v) 
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
