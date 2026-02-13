import { jidNormalizedUser, proto, getDevice } from '@whiskeysockets/baileys';

export function smsg(conn, m) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : m.isGroup ? m.key.participant : m.chat);
        m.device = getDevice(m.id);
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0];
        m.msg = m.message[m.mtype];
        
        // Extraemos el texto de cualquier lado (Mensaje, Botón, Listas, Multimedia)
        let text = m.message.conversation || m.msg.caption || m.msg.text || 
                   (m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId) || 
                   (m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId) || 
                   (m.mtype == 'viewOnceMessageV2' && m.msg.message[Object.keys(m.msg.message)[0]].caption) || 
                   m.msg.selectedDisplayText || '';

        // ASEGURAMOS QUE SEA STRING (Esto evita el error de la última foto)
        m.body = typeof text === 'string' ? text : '';
        
        m.reply = (text, chatId = m.chat, options = {}) => conn.sendMessage(chatId, { text: text, ...options }, { quoted: m });
    }
    return m;
}

export default { smsg };
