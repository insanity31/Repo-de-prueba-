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
        const cmd = comandos.get(commandName) || [...comandos.values()].find(c => c.config?.alias?.includes(commandName));

        if (!cmd) return;

        // ========== 5. SISTEMA DE PERMISOS COMPLETO ==========

        // Extraer número limpio (ej: 18096758983)
        const userNumber = m.sender.split('@')[0].split(':')[0];

        // Owner: Verifica contra la lista global.owner de settings.js
        const isOwner = global.owner.some(o => o[0] === userNumber);

        // ROwner: Usa global.rowner o hereda de isOwner
        const isROwner = isOwner || (global.rowner?.some(r => r[0] === userNumber) || false);

        // Premium: Los owners son premium por defecto
        const isPremium = isOwner || database.data.users?.[m.sender]?.premium || false;

        // Registrado: Los owners no necesitan registrarse
        const isRegistered = isOwner || database.data.users?.[m.sender]?.registered || false;

        // Admin del grupo
        const isGroup = m.isGroup;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat);
                const participant = groupMeta.participants.find(p => p.id === m.sender);
                isAdmin = participant?.admin !== undefined || isOwner; // Owners son admins virtuales

                const botParticipant = groupMeta.participants.find(p => p.id === conn.user.id);
                isBotAdmin = botParticipant?.admin !== undefined;
            } catch (err) {
                console.log(chalk.red('[ERROR GROUP META]'), err.message);
            }
        }

        // ========== 6. REGISTRO DE USUARIO AUTOMÁTICO ==========

        if (!database.data.users) database.data.users = {};

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
            await database.save();
        }

        // ========== 7. DETECCIÓN DE OBJETIVO (WHO) ==========
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted?.sender ? m.quoted.sender : m.sender);
        
        // ========== 8. FILTROS DE SEGURIDAD Y RESTRICCIONES ==========

        // 1. Baneo
        if (database.data.users[m.sender]?.banned && !isOwner) {
            return m.reply('🚫 *ESTÁS BANEADO*\nNo puedes usar los comandos de B-MAX.');
        }

        // 2. Restricción de Owner (Aquí se frena el /update a los demás)
        if (cmd.config?.owner && !isOwner) {
            return m.reply('👑 *ACCESO RESTRINGIDO*\nEste comando solo puede ser ejecutado por mi creador.');
        }

        // 3. Restricción de ROwner
        if (cmd.config?.rowner && !isROwner) {
            return m.reply('🚀 *COMANDO DE STAFF*\nSolo co-owners pueden usar esta función.');
        }

        // 4. Restricción de Premium
        if (cmd.config?.premium && !isPremium) {
            return m.reply('💎 *USUARIO PREMIUM*\nEste comando es exclusivo para miembros Premium.');
        }

        // 5. Restricción de Registro
        if (cmd.config?.register && !isRegistered) {
            return m.reply(`📝 *REGISTRO REQUERIDO*\nDebes registrarte para usar este comando.\n\n> Usa: *${prefix}reg nombre.edad*`);
        }

        // 6. Restricción de Grupo
        if (cmd.config?.group && !isGroup) {
            return m.reply('🏢 *SOLO GRUPOS*\nEste comando solo está habilitado para grupos.');
        }

        // 7. Restricción de Admin
        if (cmd.config?.admin && !isAdmin) {
            return m.reply('👮 *ERES ADMIN?*\nEste comando es solo para administradores del grupo.');
        }

        // 8. El Bot necesita ser Admin
        if (cmd.config?.botAdmin && !isBotAdmin) {
            return m.reply('🤖 *ERROR DE PERMISOS*\nNecesito ser administrador del grupo para ejecutar esta acción.');
        }

        // 9. Solo chat privado
        if (cmd.config?.private && isGroup) {
            return m.reply('💬 *CHAT PRIVADO*\nEscríbeme al privado para usar este comando.');
        }

        // ========== 9. SISTEMA DE LÍMITES (DIAMANTES) ==========
        if (cmd.config?.limit && !isPremium) {
            const userLimit = database.data.users[m.sender].limit || 0;
            if (userLimit < 1) {
                return m.reply(`⚠️ *SIN LÍMITES*\nSe han agotado tus B-Max-Coins diarios.`);
            }
            database.data.users[m.sender].limit -= 1;
            await database.save();
        }

        // ========== 10. EJECUCIÓN FINAL ==========
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
            db: database.data,
            prefix
        });

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
        // m.reply('❌ Error interno en el sistema de comandos.');
    }
};
