import './settings.js';
import chalk from 'chalk'; 
import print from './lib/print.js';
import { smsg } from './lib/simple.js';
import { database } from './lib/database.js';

export const handler = async (m, conn, comandos) => {
    try {
        if (!m) return;

        // 1. Serializamos el mensaje para que m.quoted y m.body sean accesibles
        m = smsg(conn, m); 

        // 2. Imprimimos en consola (Monitor de chats)
        await print(m, conn);

        if (!m.body) return;

        // 3. Configuración de prefijo
        const prefix = global.prefix instanceof RegExp ? '.' : (global.prefix || '.'); 
        if (!m.body.startsWith(prefix)) return;

        // 4. Parsear comando y argumentos
        const args = m.body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (!cmd) return;

        // 5. Sistema de permisos y contexto
        const isOwner = global.owner.some(o => o[0] === m.sender.split('@')[0]);
        const isGroup = m.isGroup;

        // 6. DETECCIÓN DE OBJETIVO (Esta es la clave que faltaba)
        // Prioridad: Mención (@user) > Citado (respuesta) > El que envía
        const who = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : (m.quoted ? m.quoted.sender : m.sender);

        // 7. Filtros de seguridad
        if (cmd.owner && !isOwner) return;
        if (cmd.group && !isGroup) return m.reply('🏢 Este comando solo funciona en grupos.');

        // 8. Ejecutar comando pasándole todo el contexto procesado
        await cmd.run(m, { 
            conn, 
            args, 
            isOwner, 
            isGroup, 
            who, // Ahora el comando sabe quién es el objetivo
            db: database.data 
        });

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
    }
};
