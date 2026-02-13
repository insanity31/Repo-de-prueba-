import chalk from 'chalk'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

export default async function (m, conn) {
    try {
        if (!m.message) return

        // 1. Identificar el tipo de chat y los JIDs
        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        
        // El 'sender' es quien escribe (en grupo es el participant, en privado es el remoteJid)
        const senderJid = isGroup ? m.key.participant : from
        const senderNumber = jidNormalizedUser(senderJid).split('@')[0]
        const senderName = m.pushName || 'Desconocido'

        // 2. Extraer el contenido del mensaje
        let body = m.message?.conversation || 
                   m.message?.extendedTextMessage?.text || 
                   m.message?.imageMessage?.caption || 
                   m.message?.videoMessage?.caption || 
                   m.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
                   (m.message?.buttonsResponseMessage?.selectedButtonId) || 
                   (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) || 
                   '-- [Archivo/Multimedia] --'

        // 3. Imprimir con formato jerárquico
        if (isGroup) {
            // Obtenemos el nombre del grupo desde el caché de conn
            const groupName = conn.getName ? conn.getName(from) : 'Grupo'
            
            console.log(
                chalk.white(`[${time}] `) + 
                chalk.blueBright(`[GRUPO: ${groupName.slice(0, 20)}] `) + 
                chalk.yellow(`${senderName} (${senderNumber}): `) + 
                chalk.white(body)
            )
        } else {
            console.log(
                chalk.white(`[${time}] `) + 
                chalk.green(`[PVD] `) + 
                chalk.green(`${senderName} (${senderNumber}): `) + 
                chalk.white(body)
            )
        }

    } catch (e) {
        // console.error(e) // Descomenta si necesitas debuguear fallos en el print
    }
}
