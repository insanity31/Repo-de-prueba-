export const run = async (m, { conn, args, db }) => {
    const user = db.users[m.sender];

    if (user.registered) {
        return m.reply('✅ Ya estás registrado en B-MAX.');
    }

    if (args.length < 1) {
        return m.reply(`📝 *USO CORRECTO:*\n/reg nombre.edad\n\n*EJEMPLO:*\n/reg Juan.25`);
    }

    const [name, age] = args[0].split('.');

    if (!name || !age) {
        return m.reply('❌ Formato incorrecto. Usa: /reg nombre.edad');
    }

    if (isNaN(age)) {
        return m.reply('❌ La edad debe ser un número.');
    }

    if (parseInt(age) < 13) {
        return m.reply('❌ Debes tener al menos 13 años para usar este bot.');
    }

    user.registered = true;
    user.name = name;
    user.age = parseInt(age);
    user.registered_time = Date.now();
    db.save();

    m.reply(`✅ *REGISTRO EXITOSO*

👤 Nombre: \`${name}\`
🎂 Edad: ${age} años
📅 Fecha: ${new Date().toLocaleDateString()}

Ya puedes usar todos los comandos de B-MAX.`);
};

export const config = {
    name: 'reg',
    alias: ['register', 'registrar'],
    description: 'Registrarse en el bot'
};