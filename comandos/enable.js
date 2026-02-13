export const run = async (m, { conn, args, isOwner, isAdmin, db }) => {
    // 1. Verificación de permisos (Solo Admins o Owner)
    if (!(isAdmin || isOwner)) {
        return m.reply('❌ Este comando solo puede ser usado por *Administradores*.');
    }

    // 2. Definición de qué queremos activar/desactivar y el estado
    let feature = (args[0] || '').toLowerCase();
    let status = (args[1] || '').toLowerCase();
    
    // Detectar si el usuario quiere activar o desactivar
    let isEnable = /on|enable|activar|1/g.test(status);
    let isDisable = /off|disable|desactivar|0/g.test(status);

    // 3. Inicializar base de datos si no existe
    if (!db.chats) db.chats = {};
    if (!db.chats[m.chat]) db.chats[m.chat] = {};
    let chat = db.chats[m.chat];

    // 4. Switch para manejar diferentes comandos
    switch (feature) {
        case 'nsfw':
            if (isEnable) {
                if (chat.nsfw) return m.reply('✅ El modo *NSFW* ya está activo en este grupo.');
                chat.nsfw = true;
                m.reply('✅ Se ha *activado* el contenido NSFW.');
            } else if (isDisable) {
                if (!chat.nsfw) return m.reply('❌ El modo *NSFW* ya está desactivado.');
                chat.nsfw = false;
                m.reply('❌ Se ha *desactivado* el contenido NSFW.');
            } else {
                m.reply(`💡 Uso: \`.enable nsfw on/off\``);
            }
            break;

        /* Puedes añadir más casos aquí abajo:
        case 'antilink':
            // lógica de antilink...
            break;
        */

        default:
            m.reply(`❓ *Opciones disponibles:*
            
• \`nsfw\` (on/off)

*Ejemplo:* \`.enable nsfw on\``);
            break;
    }
};

export const config = {
    name: 'enable',
    alias: ['disable', 'on', 'off'],
    group: true
};
