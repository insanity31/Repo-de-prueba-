import chalk from 'chalk'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

export default async function (m, conn) {
    try {
        if (!m || !m.message) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        
        // Quién escribe
        const senderJid = isGroup ? m.key.participant : from
        const senderNumber = jidNormalizedUser(senderJid).split('@')[0]
        const senderName = m.pushName || 'Usuario'

        // Qué dice
        let body = m.message?.conversation || 
                   m.message?.extendedTextMessage?.text || 
                   m.message?.imageMessage?.caption || 
                   m.message?.videoMessage?.caption || 
                   '-- [Multimedia/System] --'

        if (isGroup) {
            // Buscamos el nombre del grupo
            const groupName = conn.getName ? conn.getName(from) : 'Grupo'
            
            console.log(
                chalk.white(`[${time}]`) + 
                chalk.blueBright(` [G: ${groupName.slice(0, 15)}]`) + 
                chalk.yellow(` ${senderName} (${senderNumber}): `) + 
                chalk.white(body)
            )
        } else {
            console.log(
                chalk.white(`[${time}]`) + 
                chalk.green(` [PVD]`) + 
                chalk.green(` ${senderName} (${senderNumber}): `) + 
                chalk.white(body)
            )
        }
    } catch (e) {
        // No imprimimos error para no saturar la consola si algo falla
    }
}
