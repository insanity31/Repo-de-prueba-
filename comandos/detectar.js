import os from 'os'

export const run = async (m, { conn }) => {
    const used = process.memoryUsage()
    
    // Detectamos el estado del sistema
    let status = `🔍 *DETECTOR DE ESTADO B-MAX* 🔍\n\n`
    status += `⭐ *Nombre:* ${global.botname}\n`
    status += `📶 *Estado:* Online\n`
    status += `🖥️ *Plataforma:* ${os.platform()}\n`
    status += `🧠 *RAM:* ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`
    status += `⏱️ *Uptime:* ${Math.floor(process.uptime() / 60)} minutos\n\n`
    
    // Simulación de detección de errores en el Handler
    try {
        if (!m.body) throw new Error("Cuerpo del mensaje no detectado (m.body is empty)")
        status += `✅ *Handler:* Operativo\n`
        status += `✅ *Simple.js:* Serialización Correcta\n`
    } catch (err) {
        status += `⚠️ *Error Detectado:* ${err.message}\n`
    }

    await m.reply(status)
}

export const config = {
    name: 'detect',
    alias: ['estado', 'debug'],
    owner: true
}
