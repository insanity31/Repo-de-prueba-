import axios from 'axios'

export const run = async (m, { conn, db }) => {
    try {
        if (m.isGroup && !db?.chats?.[m.chat]?.nsfw) {
            return m.reply(`💙 El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#enable nsfw on*`);
        }

        let victim = m.mentionedJid?.[0] || m.quoted?.sender || null;
        let nameSender = m.pushName || 'Usuario';
        let targetName = '';
        let isAlone = true;

        if (victim && victim !== m.sender) {
            isAlone = false;
            targetName = await conn.getName(victim);
        }

        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } });

        let txt = isAlone 
            ? `*${nameSender}* se vino solo... 🥑` 
            : `*${nameSender}* se vino dentro de *${targetName}*`;

        const videoUrl = 'https://files.catbox.moe/4ws6bs.mp4';
        const { data } = await axios.get(videoUrl, { responseType: 'arraybuffer' });

        await conn.sendMessage(m.chat, { 
            video: Buffer.from(data), 
            mimetype: 'video/mp4', 
            caption: txt, 
            gifPlayback: true, 
            mentions: [m.sender, victim].filter(v => v) 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
    }
}

export const config = {
    name: 'cum',
    alias: ['correrse', 'leche', 'venirse'],
    group: true
}