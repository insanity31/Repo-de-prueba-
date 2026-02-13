import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

export const run = async (m, { conn }) => {
    const dir = './comandos'
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'))
    
    let report = `🧪 *ESCANER DE SISTEMA B-MAX*\n\n`
    let errores = []
    let exitos = 0

    await m.reply('🔍 *Analizando archivos de comando...*')

    for (const file of files) {
        const filePath = path.join(dir, file)
        try {
            // Intentamos importar el archivo para ver si tiene errores de sintaxis
            // Usamos un timestamp para evitar el cache de Node.js
            await import(`../comandos/${file}?t=${Date.now()}`)
            exitos++
        } catch (e) {
            errores.push(`❌ *Archivo:* ${file}\n⚠️ *Error:* ${e.message}`)
        }
    }

    report += `✅ *Comandos funcionales:* ${exitos}\n`
    report += `🚨 *Comandos con errores:* ${errores.length}\n\n`

    if (errores.length > 0) {
        report += `*DETALLE DE ERRORES:*\n\n${errores.join('\n\n')}`
    } else {
        report += `😎 *¡Todo perfecto! Todos los archivos están limpios.*`
    }

    await m.reply(report)
}

export const config = {
    name: 'test',
    alias: ['check', 'verificar'],
    owner: true // Solo tú deberías poder ver las entrañas del bot
}
