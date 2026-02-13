import pkg from '@whiskeysockets/baileys';
const { makeInMemoryStore } = pkg;
import pino from 'pino';

export const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Autoguardado cada 10 segundos
setInterval(() => {
    store.writeToFile('./session_bmax/store.json');
}, 10000);
