import './settings.js';
import print from './lib/print.js';
import { database } from './lib/database.js';
import { store } from './lib/store.js';

export const handler = async (m, conn, comandos) => {
    print.message(m, conn);

    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (!body.startsWith(global.prefix)) return;

        const args = body.slice(global.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (!cmd) return;

        // --- SISTEMA DE PERMISOS ---
        const isOwner = global.owner.some(o => o[0] === m.sender.split('@')[0]);
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        
        // Crear usuario en la DB si no existe
        if (!database.data.users[m.sender]) {
            database.data.users[m.sender] = {
                name: m.pushName || 'Usuario',
                premium: false,
                puntos: 0
            };
        }

        const isPremium = database.data.users[m.sender].premium || isOwner;

        // --- FILTROS ---
        if (cmd.owner && !isOwner) return m.reply(`🤖 Acceso denegado. Solo DuarteXV.`);
        if (cmd.premium && !isPremium) return m.reply(`⭐ Protocolo Premium requerido.`);
        if (cmd.group && !isGroup) return m.reply(`🏢 Solo para grupos.`);

        print.command(commandName, m);
        await cmd.run(m, { conn, args, isOwner, isPremium, db: database.data });

    } catch (e) {
        print.error("Error en Handler", e);
    }
};
