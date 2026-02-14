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

        // Extraemos el texto de cualquier lado
        let text = m.message.conversation || m.msg.caption || m.msg.text || 
                   (m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId) || 
                   (m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId) || 
                   (m.mtype == 'viewOnceMessageV2' && m.msg.message[Object.keys(m.msg.message)[0]].caption) || 
                   m.msg.selectedDisplayText || '';

        m.body = typeof text === 'string' ? text : '';

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
                           m.quoted.msg?.caption || '';

            m.quoted.text = typeof quotedText === 'string' ? quotedText : '';

            // Extraer pushName del mensaje citado
            m.quoted.pushName = contextInfo.pushName || '';
        }

        // Extraer menciones
        m.mentionedJid = contextInfo?.mentionedJid || [];

        // 🔥 FUNCIÓN REPLY
        m.reply = (text, chatId = m.chat, options = {}) => 
            conn.sendMessage(chatId, { text: text, ...options }, { quoted: m });

        // 🔥 FUNCIÓN REACT (NUEVO)
        m.react = (emoji) => 
            conn.sendMessage(m.chat, { 
                react: { text: emoji, key: m.key } 
            });
    }

    return m;
}

export default { smsg };