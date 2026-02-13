import './settings.js';
import print from './lib/print.js';
import { database } from './lib/database.js';

export const handler = async (m, conn, comandos) => {
    // ESTO MOSTRARÁ TODO EN TU SERVIDOR (Audios, Videos, etc)
    print.message(m, conn);

    try {
        // Cargar DB
        database.load();
        
        const body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype === 'imageMessage' || m.mtype === 'videoMessage') ? m.message[m.mtype].caption : '';
        
        if (!body.startsWith(global.prefix)) return;

        const args = body.slice(global.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const cmd = comandos.get(commandName);

        if (cmd) {
            print.command(commandName, m);
            await cmd.run(m, { conn, args });
        }

        // Guardar cambios en DB
        database.save();
    } catch (e) {
        print.error('Error en Handler', e);
    }
};
