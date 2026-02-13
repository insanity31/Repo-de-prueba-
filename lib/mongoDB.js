import mongoose from 'mongoose';

export const mongoDB = async (url) => {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('🔋 B-Max: Conexión a MongoDB establecida con éxito.');
    } catch (e) {
        console.error('❌ Error en MongoDB:', e);
    }
};

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    premium: Boolean,
    banned: Boolean
});

export const User = mongoose.model('User', userSchema);
