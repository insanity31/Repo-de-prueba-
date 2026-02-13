import fs from 'fs';

export const database = {
    data: {
        users: {},
        groups: {},
        settings: {},
        chats: {}
    },
    filepath: './database.json',
    
    // Esta es la función que te falta según el error
    load() {
        if (fs.existsSync(this.filepath)) {
            try {
                this.data = JSON.parse(fs.readFileSync(this.filepath, 'utf-8'));
                console.log('✅ Base de datos cargada correctamente.');
            } catch (e) {
                console.log("⚠️ Error al leer database.json, creando uno nuevo...");
                this.save();
            }
        } else {
            this.save(); // Crea el archivo si no existe
        }
    },
    
    save() {
        try {
            fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.error('❌ Error al guardar la base de datos:', e);
        }
    }
};
