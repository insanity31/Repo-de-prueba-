import chalk from 'chalk';
import moment from 'moment-timezone';

const print = {
    message: (m, conn) => {
        const time = moment().tz('America/Bogota').format('HH:mm:ss');
        const name = m.pushName || 'Usuario Desconocido';
        const sender = m.sender.split('@')[0];
        const chat = m.key.remoteJid.endsWith('@g.us') ? chalk.yellow('[GRUPO]') : chalk.magenta('[PRIVADO]');
        
        // Identificación de Medios
        let type = Object.keys(m.message)[0];
        let content = '';
        let icon = '💬';

        switch (type) {
            case 'conversation':
            case 'extendedTextMessage':
                content = m.body || m.message?.conversation || m.message?.extendedTextMessage?.text;
                break;
            case 'imageMessage':
                icon = '📸';
                content = chalk.cyan('Imagen ') + (m.message.imageMessage.caption ? `: ${m.message.imageMessage.caption}` : '');
                break;
            case 'videoMessage':
                icon = '🎥';
                content = chalk.green('Video ') + (m.message.videoMessage.caption ? `: ${m.message.videoMessage.caption}` : '');
                break;
            case 'audioMessage':
                icon = '🎤';
                content = chalk.red(m.message.audioMessage.ptt ? 'Nota de voz' : 'Audio');
                break;
            case 'stickerMessage':
                icon = '🖼️';
                content = chalk.yellow('Sticker');
                break;
            case 'documentMessage':
                icon = '📄';
                content = chalk.blue('Documento: ') + m.message.documentMessage.title;
                break;
            case 'contactMessage':
                icon = '👤';
                content = chalk.white('Contacto: ') + m.message.contactMessage.displayName;
                break;
            case 'viewOnceMessageV2':
                icon = '👁️';
                content = chalk.bgRed.white(' Mensaje Ver una vez ');
                break;
            default:
                content = chalk.dim('Mensaje de sistema o desconocido');
        }

        console.log(
            chalk.cyan(`[${time}] `) +
            chat + chalk.white(` | `) +
            chalk.green(`${name} (${sender})`) + chalk.white(`: `) +
            `${icon} ${content}`
        );
    },

    command: (cmdName, m) => {
        const time = moment().tz('America/Bogota').format('HH:mm:ss');
        console.log(chalk.bgBlue.white(` CMD `) + chalk.blue(` /${cmdName} `) + chalk.white(`por ${m.pushName}`));
    },

    error: (text, err) => {
        const time = moment().tz('America/Bogota').format('HH:mm:ss');
        console.log(chalk.red(`[${time}] ERROR: ${text}`));
        if (err) console.log(err);
    }
};

export default print;
