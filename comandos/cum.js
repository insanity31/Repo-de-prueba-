//Mejore el código a uno de saludo pero el video gif no cambia.
//Es un objeto de prueba nada mas.

import axios from 'axios'
import fetch from 'node-fetch' 

export const run = async (m, { conn, db }) => {
    try {
        // 1. OBTENCIÓN DEL OBJETIVO (Mención, Texto o Citado)
        let victim = null
        
        // A. Intentar por mención oficial
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            victim = m.mentionedJid[0]
        } 
        // B. Intentar por búsqueda manual en el texto (Si el handler falla)
        else {
            const text = m.text || m.body || ''
            const extract = text.match(/@(\d+)/)
            if (extract) {
                victim = extract[1] + '@s.whatsapp.net'
            }
        }
        // C. Intentar por mensaje citado
        if (!victim && m.quoted) {
            victim = m.quoted.sender
        }
        
        // 2. LÓGICA DE DETECCIÓN
        let nameSender = m.pushName || await conn.getName(m.sender) || 'Usuario'
        let targetName = ''
        let isAlone = true
        
        // Limpiar números
        const senderNum = m.sender.replace(/[^0-9]/g, '')
        const victimNum = victim ? victim.replace(/[^0-9]/g, '') : null
        
        // Array de menciones para el mensaje
        let mentions = [m.sender]
        
        if (victimNum && victimNum !== senderNum) {
            isAlone = false
            
            // Intentar obtener el nombre del objetivo
            let victimName = ''
            
            // 1. Intentar obtener nombre del mensaje citado
            if (m.quoted && m.quoted.sender === victim) {
                victimName = m.quoted.pushName || ''
            }
            
            // 2. Si no hay nombre, intentar con conn.getName
            if (!victimName) {
                try {
                    victimName = await conn.getName(victim)
                } catch (e) {
                    victimName = ''
                }
            }
            
            // 3. Si el nombre contiene @ o está vacío, usar el número
            if (!victimName || victimName.includes('@s.whatsapp.net')) {
                victimName = victimNum
            }
            
            targetName = victimName
            mentions.push(victim)
        }
        
        // 3. REACCIÓN
        await conn.sendMessage(m.chat, { react: { text: '👋', key: m.key } })
        
        // 4. TEXTO con menciones correctas
        let txt = isAlone 
            ? `@${senderNum} se saluda solo 👋` 
            : `@${senderNum} saluda a @${victimNum} 👋`
        
        // 5. VIDEO
        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4' // Catbox a veces falla xd
        
        try {
            const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' })
            
            await conn.sendMessage(m.chat, { 
                video: Buffer.from(data), 
                mimetype: 'video/mp4',
                caption: txt, 
                gifPlayback: true,
                mentions: mentions
            }, { quoted: m })
        } catch (videoError) {
            // Si falla el video, solo enviar el texto
            await conn.sendMessage(m.chat, { 
                text: txt,
                mentions: mentions
            }, { quoted: m })
        }
        
    } catch (e) {
        console.error("ERROR:", e)
        await conn.reply(m.chat, e.message, m)
    }
}

export const config = {
    name: 'hola',
    alias: ['reacts'],
    group: true 
}