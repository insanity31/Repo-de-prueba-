import { exec } from 'child_process'
import { promisify } from 'util'
const execPromise = promisify(exec)

export const run = async (m, { conn, isOwner }) => {
    if (!isOwner) return // Solo tú puedes actualizar el bot
    
    await m.reply('🚀 *Iniciando actualización desde GitHub...*')
    
    try {
        const { stdout, stderr } = await execPromise('git pull')
        
        if (stdout.includes('Already up to date')) {
            return await m.reply('✅ *B-MAX ya está actualizado a la última versión.*')
        }
        
        await m.reply(`✅ *Actualización exitosa:*\n\n${stdout}`)
        await m.reply('🔄 *Reiniciando para aplicar cambios...*')
        
        // El panel de NeviHost reiniciará el proceso automáticamente al morir
        process.exit(0) 

    } catch (e) {
        await m.reply(`❌ *Error en la actualización:* \n${e.message}`)
    }
}

export const config = {
    name: 'update',
    owner: true
}
