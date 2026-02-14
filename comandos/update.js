import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export const run = async (m, { conn }) => {
    // No necesitas validar 'isOwner' aquí, el Handler ya lo hizo por ti.
    
    await m.reply('🚀 *Iniciando actualización desde GitHub...*')

    try {
        const { stdout, stderr } = await execPromise('git pull')

        if (stdout.includes('Already up to date')) {
            return await m.reply('✅ *B-MAX ya está actualizado a la última versión.*')
        }

        if (stderr && !stdout) {
             return await m.reply(`⚠️ *Hubo un aviso durante la descarga:* \n\n\`\`\`${stderr}\`\`\``)
        }

        await m.reply(`✅ *Actualización exitosa:*\n\n\`\`\`${stdout}\`\`\``)
        await m.reply('🔄 *Reiniciando para aplicar cambios...*')

        // El panel de NeviHost reiniciará el proceso automáticamente
        process.exit(0) 

    } catch (e) {
        await m.reply(`❌ *Error crítico en la actualización:*\n\n\`\`\`${e.message}\`\`\``)
    }
}

export const config = {
    name: 'update',
    alias: ['actualizar', 'gitpull'],
    description: 'Actualizar el bot desde GitHub',
    owner: true // El Handler lee esto y restringe el acceso automáticamente
}
