import chalk from 'chalk'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

/**
 * Monitor de chats para B-MAX
 * Muestra la actividad en la consola del servidor
 */
export default async function (m, conn) {
    try {
        // 1. Extraer la información básica
        const sender = m.pushName || 'Usuario'
        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        
        // 2. Obtener el texto del mensaje (manejando diferentes tipos)
        let body = m.message?.conversation || 
                   m.message?.extendedTextMessage?.text || 
                   m.message?.imageMessage?.caption || 
                   m.message?.videoMessage?.caption || 
                   (m.message?.buttonsResponseMessage?.selectedButtonId) || 
                   (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) || 
                   '-- [Multimedia / Tipo No Soportado] --'

        // 3. Limpiar JID para mostrar solo el número
        const userJid = jidNormalizedUser(m.key.participant || m.key.remoteJid).split('@')[0]

        // 4. Formatear la salida según el tipo de chat
        if (isGroup) {
            // Obtener nombre del grupo del store o metadata
            const groupMetadata = conn.chats?.[from]?.metadata || {}
            const groupName = groupMetadata.subject || 'Grupo'
            
            console.log(
                chalk.black.bgWhite(` ${time} `) + 
                chalk.black.bgCyan(` GRUPO `) + 
                chalk.cyan(` ${groupName.slice(0, 15)}... `) + 
                chalk.white(`| `) + 
                chalk.yellow(`${sender} (${userJid}): `) + 
                chalk.white(body)
            )
        } else {
            console.log(
                chalk.black.bgWhite(` ${time} `) + 
                chalk.black.bgGreen(` CHAT PRIVADO `) + 
                chalk.green(` ${sender} (${userJid}): `) + 
                chalk.white(body)
            )
        }

    } catch (e) {
        // Silenciamos errores de impresión para no detener el bot
    }
}
