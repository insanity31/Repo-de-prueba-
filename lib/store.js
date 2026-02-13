import pkg from '@whiskeysockets/baileys';
const { makeInMemoryStore } = pkg;
import pino from 'pino';
import fs from 'fs';

export const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Ruta de la sesión
const sessionPath = './session_bmax';

// Crear la carpeta si no existe para evitar el error ENOENT
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

// Autoguardado cada 10 segundos
setInterval(() => {
    try {
        store.writeToFile(`${sessionPath}/store.json`);
    } catch (e) {
        // Silenciamos el error si aún no hay mensajes que guardar
    }
}, 10000);

export default store;
