import './settings.js';
import chalk from 'chalk'; // ESTE ERA EL QUE FALTABA
import print from './lib/print.js';
import { smsg } from './lib/simple.js';
import { database } from './lib/database.js';

export const handler = async (m, conn, comandos) => {
    try {
        // 1. Serializamos el mensaje
        m = smsg(conn, m); 

        // 2. Imprimimos en consola (Monitor de chats)
        await print(m, conn);

        if (!m || !m.body) return;
        
        // 3. Configuración de prefijo
        const prefix = global.prefix instanceof RegExp ? '.' : (global.prefix || '.'); 
        if (!m.body.startsWith(prefix)) return;

        // 4. Parsear comando y argumentos
        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (!cmd) return;

        // 5. Sistema de permisos
        const isOwner = global.owner.some(o => o[0] === m.sender.split('@')[0]);
        const isGroup = m.isGroup;

        // 6. Filtros de seguridad
        if (cmd.owner && !isOwner) return;
        if (cmd.group && !isGroup) return m.reply('🏢 Este comando solo funciona en grupos.');

        // 7. Ejecutar comando
        await cmd.run(m, { conn, args, isOwner, db: database.data });

    } catch (e) {
        // Ahora chalk sí está definido, así que no habrá ReferenceError
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
    }
};
