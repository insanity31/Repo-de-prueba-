import './settings.js';
import print from './lib/print.js';
import { smsg } from './lib/simple.js'; // IMPORTAMOS EL SIMPLE
import { database } from './lib/database.js';

export const handler = async (m, conn, comandos) => {
    try {
        // --- SERIALIZACIÓN ---
        // Esto convierte el mensaje rancio de Baileys en un objeto 'm' con poderes
        m = smsg(conn, m); 

        // 1. Imprimir en consola (lo que ya te funciona)
        await print(m, conn);

        if (!m.message) return;
        
        // Ahora puedes usar m.body directamente gracias al simple.js
        const body = m.body || '';
        const prefix = global.prefix instanceof RegExp ? '.' : (global.prefix || '.'); 
        
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (!cmd) return;

        // --- SISTEMA DE PERMISOS ---
        const isOwner = global.owner.some(o => o[0] === m.sender.split('@')[0]);
        
        // Ejemplo de uso de m.reply gracias al simple.js
        if (cmd.owner && !isOwner) return m.reply(`🤖 Solo DuarteXV puede usar esto.`);

        // 7. EJECUTAR
        await cmd.run(m, { conn, args, isOwner, db: database.data });

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
    }
};
