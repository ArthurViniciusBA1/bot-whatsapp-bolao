import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    'Por favor, defina a variável de ambiente MONGO_URI no seu ficheiro .env'
  );
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado com sucesso à base de dados MongoDB Atlas!');
  } catch (error) {
    console.error('❌ Erro ao conectar à base de dados MongoDB Atlas:', error);
    process.exit(1); // Encerra o processo se não conseguir conectar
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Desconectado da base de dados MongoDB.');
});
