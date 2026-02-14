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

        // ========== 5. SISTEMA DE PERMISOS COMPLETO ==========
        
        // Limpiar número de usuario
        const userNumber = m.sender.split('@')[0].split(':')[0];
        
        // Owner (propietario principal)
        const isOwner = global.owner.some(o => o[0] === userNumber);
        
        // ROwner (propietarios secundarios/co-owners)
        const isROwner = global.rowner?.some(r => r[0] === userNumber) || false;
        
        // Premium (usuarios premium)
        const isPremium = database.data.users?.[m.sender]?.premium || false;
        
        // Registrado
        const isRegistered = database.data.users?.[m.sender]?.registered || false;
        
        // Admin del grupo
        const isGroup = m.isGroup;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat);
                const participant = groupMeta.participants.find(p => p.id === m.sender);
                isAdmin = participant?.admin !== undefined;
                
                const botParticipant = groupMeta.participants.find(p => p.id === conn.user.id);
                isBotAdmin = botParticipant?.admin !== undefined;
            } catch (err) {
                console.log(chalk.red('[ERROR GROUP META]'), err.message);
            }
        }

        // ========== 6. REGISTRO DE USUARIO ==========
        
        // Auto-crear usuario en la base de datos si no existe
        if (!database.data.users) {
            database.data.users = {};
        }

        if (!database.data.users[m.sender]) {
            database.data.users[m.sender] = {
                registered: false,
                premium: false,
                banned: false,
                warning: 0,
                exp: 0,
                level: 1,
                limit: 20,
                lastclaim: 0,
                registered_time: 0
            };
            database.save();
        }

        // ========== 7. DETECCIÓN DE OBJETIVO ==========
        let who = null;

        if (m.mentionedJid && m.mentionedJid[0]) {
            who = m.mentionedJid[0];
        } else if (m.quoted?.sender) {
            who = m.quoted.sender;
        }

        // Limpieza de ID
        if (who) {
            who = who.split('@')[0].split(':')[0] + '@s.whatsapp.net';
        }

        // ========== 8. FILTROS DE SEGURIDAD Y PERMISOS ==========
        
        // Verificar si el usuario está baneado
        if (database.data.users[m.sender]?.banned && !isOwner) {
            return m.reply('🚫 Estás baneado del bot. Contacta al owner.');
        }

        // Verificar si el comando requiere owner
        if (cmd.owner && !isOwner) {
            return m.reply('👑 Este comando solo puede ser usado por el owner del bot.');
        }

        // Verificar si el comando requiere rowner
        if (cmd.rowner && !isROwner && !isOwner) {
            return m.reply('👑 Este comando solo puede ser usado por los co-owners del bot.');
        }

        // Verificar si el comando requiere premium
        if (cmd.premium && !isPremium && !isOwner) {
            return m.reply('💎 Este comando es solo para usuarios premium.\n> Contacta al owner para obtener premium.');
        }

        // Verificar si el comando requiere registro
        if (cmd.register && !isRegistered && !isOwner) {
            return m.reply(`📝 Debes registrarte para usar este comando.\n> Usa: *${prefix}register nombre.edad*\n> Ejemplo: *${prefix}register Juan.25*`);
        }

        // Verificar si el comando requiere grupo
        if (cmd.group && !isGroup) {
            return m.reply('🏢 Este comando solo funciona en grupos.');
        }

        // Verificar si el comando requiere admin del grupo
        if (cmd.admin && !isAdmin && !isOwner) {
            return m.reply('👮 Este comando solo puede ser usado por administradores del grupo.');
        }

        // Verificar si el comando requiere que el bot sea admin
        if (cmd.botAdmin && !isBotAdmin) {
            return m.reply('🤖 Necesito ser administrador del grupo para usar este comando.');
        }

        // Verificar si el comando requiere chat privado
        if (cmd.private && isGroup) {
            return m.reply('💬 Este comando solo funciona en chat privado.');
        }

        // ========== 9. SISTEMA DE LÍMITES (OPCIONAL) ==========
        
        // Reducir límite de uso (excepto owner/premium)
        if (cmd.limit && !isPremium && !isOwner) {
            const userLimit = database.data.users[m.sender].limit || 0;
            
            if (userLimit < 1) {
                return m.reply(`⚠️ Se te acabaron los límites de uso.\n💎 Los usuarios premium tienen límites ilimitados.\n\n> Contacta al owner o espera al reset diario.`);
            }
            
            database.data.users[m.sender].limit -= 1;
            database.save();
        }

        // ========== 10. EJECUTAR COMANDO ==========
        await cmd.run(m, { 
            conn, 
            args, 
            isOwner, 
            isROwner,
            isPremium,
            isRegistered,
            isAdmin,
            isBotAdmin,
            isGroup, 
            who,
            db: database.data 
        });

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
        m.reply('❌ Ocurrió un error al ejecutar el comando.');
}
    