import './settings.js';
import chalk from 'chalk'; 
import print from './lib/print.js';
import { smsg } from './lib/simple.js';
import { database } from './lib/database.js';

const toNum = v => (v + '').replace(/[^0-9]/g, '')
const localPart = v => (v + '').split('@')[0].split(':')[0].split('/')[0].split(',')[0]
const normalizeCore = v => toNum(localPart(v))

const normalizeJid = v => {
    if (!v) return ''
    if (typeof v === 'number') v = String(v)
    v = (v + '').trim()
    if (v.startsWith('@')) v = v.slice(1)
    if (v.endsWith('@g.us')) return v
    if (v.includes('@s.whatsapp.net')) {
        const n = toNum(v.split('@')[0])
        return n ? n + '@s.whatsapp.net' : v
    }
    const n = toNum(v)
    return n ? n + '@s.whatsapp.net' : v
}

function pickOwners() {
    const arr = Array.isArray(global.owner) ? global.owner : []
    const flat = []
    for (const v of arr) {
        if (Array.isArray(v)) flat.push({ num: normalizeCore(v[0]), root: !!v[2] })
        else flat.push({ num: normalizeCore(v), root: false })
    }
    return flat
}

function isOwnerJid(jid) {
    const num = normalizeCore(jid)
    return pickOwners().some(o => o.num === num)
}

function isRootOwnerJid(jid) {
    const num = normalizeCore(jid)
    return pickOwners().some(o => o.num === num && o.root)
}

function isPremiumJid(jid) {
    const num = normalizeCore(jid)
    const prems = Array.isArray(global.prems) ? global.prems.map(normalizeCore) : []
    if (prems.includes(num)) return true
    const u = database.data?.users?.[normalizeJid(jid)]
    return !!u?.premium
}

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

        // Normalizar sender
        const senderRawFull = m.sender || ''
        const senderCanonical = senderRawFull.replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
        if (senderCanonical !== m.sender) {
            m.realSender = m.sender
            m.sender = senderCanonical
        }

        // Extraer número limpio
        const userNumber = normalizeCore(m.sender)

        // Roles jerárquicos
        const isROwner = isRootOwnerJid(m.sender)
        const isOwner = isROwner || isOwnerJid(m.sender)
        const isPremium = isOwner || isPremiumJid(m.sender)
        const isRegistered = isOwner || database.data.users?.[m.sender]?.registered || false

        // Admin del grupo
        const isGroup = m.isGroup;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat);
                const participant = groupMeta.participants.find(p => p.id === m.sender);
                isAdmin = participant?.admin !== undefined || isOwner;
                
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
                registered_time: 0,
                name: m.pushName || '',
                age: null
            };
            await database.save();
        }

        // ========== 7. DETECCIÓN DE OBJETIVO (WHO) ==========
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

        // ========== 8. FILTROS DE SEGURIDAD Y RESTRICCIONES ==========

        // 1. Baneo
        if (database.data.users[m.sender]?.banned && !isOwner) {
            return m.reply('🚫 *ESTÁS BANEADO*\nNo puedes usar los comandos del bot.');
        }

        // 2. Restricción de ROwner (root owner)
        if (cmd.config?.rowner && !isROwner) {
            return m.reply('👑 *ACCESO DENEGADO*\nEste comando solo puede ser ejecutado por el creador principal.');
        }

        // 3. Restricción de Owner
        if (cmd.config?.owner && !isOwner) {
            return m.reply('👑 *ACCESO RESTRINGIDO*\nEste comando solo puede ser ejecutado por mi creador.');
        }

        // 4. Restricción de Premium
        if (cmd.config?.premium && !isPremium) {
            return m.reply('💎 *USUARIO PREMIUM*\nEste comando es exclusivo para miembros Premium.');
        }

        // 5. Restricción de Registro
        if (cmd.config?.register && !isRegistered) {
            return m.reply(`📝 *REGISTRO REQUERIDO*\nDebes registrarte para usar este comando.\n\n> Usa: *${prefix}reg nombre.edad*\n> Ejemplo: *${prefix}reg Juan.25*`);
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

        // ========== 9. SISTEMA DE LÍMITES ==========
        if (cmd.config?.limit && !isPremium && !isOwner) {
            const userLimit = database.data.users[m.sender].limit || 0;
            if (userLimit < 1) {
                return m.reply(`⚠️ *SIN LÍMITES*\nSe han agotado tus límites diarios.\n💎 Los usuarios premium tienen límites ilimitados.`);
            }
            database.data.users[m.sender].limit -= 1;
            await database.save();
        }

        // ========== 10. EJECUCIÓN FINAL ==========
        try {
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
        } catch (cmdError) {
            console.log(chalk.red('[ERROR COMANDO]'), cmdError);
            m.reply('❌ Ocurrió un error al ejecutar el comando.');
        }

    } catch (e) {
        console.log(chalk.red(`[ERROR HANDLER]:`), e);
    }
};