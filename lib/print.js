import chalk from 'chalk'

export default async function (m, conn) {
    try {
        // Si m no existe o no tiene cuerpo de mensaje, no imprimimos nada
        if (!m || !m.id) return

        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        
        // Datos ya procesados por simple.js
        const isGroup = m.isGroup
        const senderNumber = m.sender.split('@')[0]
        const senderName = m.pushName || 'Usuario'
        const body = m.body || m.text || '-- [Multimedia/System] --'

        if (isGroup) {
            // Nombre del grupo usando la función de conn
            const groupName = conn.getName ? conn.getName(m.chat) : 'Grupo'
            
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
        // Error silencioso para no crashear el bot
    }
}
