import { performance } from 'perf_hooks';

export default {
    run: async (m, { conn }) => {
        // Marcamos el inicio de la prueba de rendimiento
        const start = performance.now();
        
        // Enviamos un mensaje inicial de "Escaneando"
        const { key } = await conn.sendMessage(m.chat, { 
            text: '🏥 *Iniciando escaneo de respuesta...*' 
        }, { quoted: m });

        // Marcamos el final
        const end = performance.now();
        
        // Calculamos la latencia en milisegundos
        // Usamos Math.round para un número limpio
        const latencia = Math.round(end - start);

        // Editamos el mensaje con el resultado final
        await conn.sendMessage(m.chat, { 
            text: `🤖 *SISTEMA B-MAX ACTIVO*\n\n` +
                 `🚀 *Latencia:* ${latencia} ms\n` +
                 `📡 *Servidor:* Safari Connection\n` +
                 `👨‍💻 *Powered by:* DuarteXV`,
            edit: key 
        });
    },
    owner: false,
    premium: false,
    group: false
};
