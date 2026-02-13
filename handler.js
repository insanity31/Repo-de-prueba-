import './settings.js';
import chalk from 'chalk'; 
import print from './lib/print.js';
import { smsg } from './lib/simple.js';
import { database } from './lib/database.js';

export const handler = async (m, conn, comandos) => {
    try {
        if (!m) return;

        // 1. Serialización del mensaje
        m = smsg(conn, m); 

        // 2. Monitor de chats
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

        // 5. Sistema de permisos
        const isOwner = global.owner.some(o => o[0] === m.sender.split('@')[0]);
        const isGroup = m.isGroup;
        const isAdmin = m.isGroup ? (m.participant && m.isGroup ? (await conn.groupMetadata(m.chat)).participants.find(p => p.id === m.sender).admin : false) : false;

        // 6. DETECCIÓN DE OBJETIVO MEJORADA (La solución definitiva)
        // Buscamos mención, luego citado, y si no hay nada, el sender
        let who = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : (m.quoted ? m.quoted.sender : m.sender);

        // Limpieza de ID (quitar :1, :2 etc)
        if (who) {
            who = who.split('@')[0].split(':')[0] + '@s.whatsapp.net';
        }

        // 7. Filtros de seguridad
        if (cmd.owner && !isOwner) return;
        if (cmd.group && !isGroup) return m.reply('🏢 Este comando solo funciona en grupos.');

        // 8. Ejecutar comando
        await cmd.run(m, { 
            conn, 
            args, 
            isOwner, 
            isAdmin,
            isGroup, 
            who, // Ahora 'who' llegará limpio y detectado al comando
            db: database.data 
        });

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
    }
};
