import { exec } from 'child_process'
import { promisify } from 'util'
const execPromise = promisify(exec)

export const run = async (m, { conn, isOwner }) => {
    // ❌ ANTES (sin mensaje):
    // if (!isOwner) return

    // ✅ AHORA (con mensaje - PERO NO ES NECESARIO):
    // El handler YA maneja esto, así que puedes quitar esta línea
    // if (!isOwner) return m.reply('👑 Este comando es solo para el owner.')

    await m.reply('🚀 *Iniciando actualización desde GitHub...*')

    try {
        const { stdout, stderr } = await execPromise('git pull')

        if (stdout.includes('Already up to date')) {
            return await m.reply('✅ *B-MAX ya está actualizado a la última versión.*')
        }

        await m.reply(`✅ *Actualización exitosa:*\n\n\`\`\`${stdout}\`\`\``)
        await m.reply('🔄 *Reiniciando para aplicar cambios...*')

        // El panel de NeviHost reiniciará el proceso automáticamente al morir
        process.exit(0) 

    } catch (e) {
        await m.reply(`❌ *Error en la actualización:*\n\n\`\`\`${e.message}\`\`\``)
    }
}

export const config = {
    name: 'update',
    alias: ['actualizar', 'gitpull'],
    description: 'Actualizar el bot desde GitHub',
    owner: true // ← Esto hace que el handler valide automáticamente
}