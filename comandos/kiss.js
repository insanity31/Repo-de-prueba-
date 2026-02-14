import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        // 1. OBTENCIÓN DE VÍCTIMA (Mención o Citado)
        let victim = (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null);

        // 2. LÓGICA DE IDENTIDADES (Anti-LID y Anti-Multidispositivo)
        const senderNum = m.sender.split('@')[0].split(':')[0]
        const victimNum = victim ? victim.split('@')[0].split(':')[0] : null
        
        let nameSender = m.pushName || 'Usuario'
        let targetName = ''
        let isAlone = true

        if (victimNum && victimNum !== senderNum) {
            isAlone = false
            // Intentar sacar el nombre real
            targetName = m.quoted?.pushName || (conn.getName ? conn.getName(victim) : victimNum)
            if (targetName.includes('@')) targetName = victimNum
        }

        // 3. SELECCIÓN DE VIDEO ALEATORIO
        const videos = [
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784879173.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784874988.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784869583.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784864195.mp4',
            'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745784856547.mp4'
            // Puedes añadir el resto de tus links aquí...
        ]
        const videoUrl = videos[Math.floor(Math.random() * videos.length)]

        // 4. DESCARGAR EL VIDEO (Solución al error ERR_BAD_REQUEST)
        // Descargamos el buffer manualmente para que Baileys no falle al intentar obtenerlo
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })

        // 5. TEXTO Y REACCIÓN
        await m.react('💋')
        const txt = isAlone 
            ? `\`${nameSender}\` se besó a sí mismo/a ( ˘ ³˘)♥` 
            : `\`${nameSender}\` besó a \`${targetName}\` ( ˘ ³˘)♥`

        // 6. ENVÍO DEFINITIVO
        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), // Enviamos el buffer descargado
            mimetype: 'video/mp4',
            caption: txt, 
            gifPlayback: true,
            mentions: [m.sender, victim].filter(Boolean) 
        }, { quoted: m })

    } catch (e) {
        console.error("❌ ERROR EN KISS:", e)
        // Si el error es de Axios, puede ser que el link esté caído
        if (e.response) m.reply('⚠️ El servidor de videos no responde. Intenta de nuevo.')
    }
}

export const config = {
    name: 'kiss',
    alias: ['besar'],
    group: true 
}
