import { performance } from 'perf_hooks';

export const run = async (m, { conn }) => {
    // 1. Marca de tiempo inicial
    let start = performance.now();

    // 2. Mensaje de espera
    await m.reply('🚀 *Calculando latencia de B-MAX...*');

    // 3. Marca de tiempo final
    let end = performance.now();

    // 4. Cálculo de la diferencia
    let latencia = (end - start).toFixed(3);

    // 5. Respuesta final con estilo
    const texto = `✅ *PONG!*
    
📡 *Latencia:* ${latencia} ms
🤖 *Estado:* Online
☁️ *Servidor:* NeviHost`;

    await conn.sendMessage(m.chat, { text: texto }, { quoted: m });
};

// Configuración del comando para el handler
export const config = {
    name: 'ping',
    description: 'Verifica la velocidad del bot',
    group: false, // Se puede usar en privado y grupos
    owner: false  // Cualquiera puede usarlo
};
