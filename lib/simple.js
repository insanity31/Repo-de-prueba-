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

        // Extraer texto de cualquier tipo de mensaje
        let text = m.message.conversation || 
                   m.msg?.caption || 
                   m.msg?.text || 
                   (m.mtype === 'listResponseMessage' && m.msg.singleSelectReply?.selectedRowId) || 
                   (m.mtype === 'buttonsResponseMessage' && m.msg.selectedButtonId) || 
                   (m.mtype === 'viewOnceMessageV2' && m.msg.message?.[Object.keys(m.msg.message)[0]]?.caption) || 
                   m.msg?.selectedDisplayText || 
                   '';

        m.body = typeof text === 'string' ? text : '';
        m.text = m.body; // Alias para compatibilidad

        // 🔥 SERIALIZAR MENSAJE CITADO
        const contextInfo = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo;

        if (contextInfo?.quotedMessage) {
            m.quoted = {
                key: {
                    remoteJid: m.chat,
                    fromMe: contextInfo.participant === jidNormalizedUser(conn.user.id),
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                },
                message: contextInfo.quotedMessage,
                sender: jidNormalizedUser(contextInfo.participant || m.chat),
                mtype: Object.keys(contextInfo.quotedMessage)[0],
                msg: contextInfo.quotedMessage[Object.keys(contextInfo.quotedMessage)[0]]
            };

            // Extraer texto del mensaje citado
            let quotedText = m.quoted.message.conversation || 
                           m.quoted.msg?.text || 
                           m.quoted.msg?.caption || 
                           '';

            m.quoted.text = typeof quotedText === 'string' ? quotedText : '';

            // Extraer pushName del mensaje citado
            m.quoted.pushName = contextInfo.pushName || '';
        }

        // 🔥 EXTRAER MENCIONES
        m.mentionedJid = contextInfo?.mentionedJid || [];

        // 🔥 FUNCIÓN REPLY
        m.reply = async (text, chatId = m.chat, options = {}) => {
            return await conn.sendMessage(chatId, { text: String(text), ...options }, { quoted: m });
        };

        // 🔥 FUNCIÓN REACT
        m.react = async (emoji) => {
            return await conn.sendMessage(m.chat, { 
                react: { text: String(emoji), key: m.key } 
            });
        };

        // 🔥 FUNCIÓN ENVIAR MENSAJE (sin quote)
        m.send = async (text, chatId = m.chat, options = {}) => {
            return await conn.sendMessage(chatId, { text: String(text), ...options });
        };
    }

    return m;
}

export default { smsg };