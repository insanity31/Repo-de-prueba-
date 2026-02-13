import './settings.js';
import print from './lib/print.js';
import { database } from './lib/database.js';
import { store } from './lib/store.js';

export const handler = async (m, conn, comandos) => {
    // LLAMADA DIRECTA: Quité el ".message" porque el print es la función principal
    await print(m, conn);

    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        
        // Verificación de prefijo (usa el de settings o el global)
        const prefix = global.prefix instanceof RegExp ? global.prefix.source.replace('^', '').replace('[', '').replace(']', '').split('')[0] : (global.prefix || '.');
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (!cmd) return;

        // --- SISTEMA DE PERMISOS ---
        const senderId = m.sender || m.key.participant || m.key.remoteJid;
        const isOwner = global.owner.some(o => o[0] === senderId.split('@')[0]);
        const isGroup = m.key.remoteJid.endsWith('@g.us');

        // Crear usuario en la DB si no existe
        if (!database.data.users[senderId]) {
            database.data.users[senderId] = {
                name: m.pushName || 'Usuario',
                premium: false,
                puntos: 0
            };
        }

        const isPremium = database.data.users[senderId].premium || isOwner;

        // --- FILTROS ---
        if (cmd.owner && !isOwner) return conn.sendMessage(m.key.remoteJid, { text: `🤖 Acceso denegado. Solo DuarteXV.` }, { quoted: m });
        if (cmd.premium && !isPremium) return conn.sendMessage(m.key.remoteJid, { text: `⭐ Protocolo Premium requerido.` }, { quoted: m });
        if (cmd.group && !isGroup) return conn.sendMessage(m.key.remoteJid, { text: `🏢 Solo para grupos.` }, { quoted: m });

        // Ejecución del comando
        await cmd.run(m, { conn, args, isOwner, isPremium, db: database.data });

    } catch (e) {
        console.error(chalk.red("Error en Handler:"), e);
    }
};
