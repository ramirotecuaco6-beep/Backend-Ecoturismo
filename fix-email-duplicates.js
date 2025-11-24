import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function fixEmailDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoturismo');
    console.log('🔗 Conectado a MongoDB...');
    
    const users = mongoose.connection.collection('users');
    
    // 1. Verificar documentos con email null
    const nullEmailUsers = await users.find({ email: null }).toArray();
    console.log(`📊 Encontrados ${nullEmailUsers.length} documentos con email null`);
    
    if (nullEmailUsers.length > 0) {
      console.log('📝 Documentos con email null:');
      nullEmailUsers.forEach(doc => {
        console.log(`   - _id: ${doc._id}, uid: ${doc.uid || 'N/A'}, displayName: ${doc.displayName || 'N/A'}`);
      });
    }
    
    // 2. Verificar índice de email
    const indexes = await users.indexes();
    const emailIndex = indexes.find(index => index.name === 'email_1');
    
    console.log('📋 Índice email actual:', emailIndex);
    
    if (emailIndex && !emailIndex.sparse) {
      console.log('🔄 El índice email no es sparse, recreándolo...');
      
      await users.dropIndex('email_1');
      console.log('✅ Índice email eliminado');
      
      await users.createIndex({ email: 1 }, { 
        unique: true, 
        sparse: true,
        name: 'email_1' 
      });
      console.log('✅ Índice email recreado como sparse');
    }
    
    // 3. Para usuarios con email null, asignar email temporal basado en UID
    if (nullEmailUsers.length > 0) {
      console.log('🔄 Asignando emails temporales a usuarios sin email...');
      
      for (const user of nullEmailUsers) {
        if (user.uid) {
          const tempEmail = `user_${user.uid}@temp.ecoturismo.com`;
          await users.updateOne(
            { _id: user._id },
            { $set: { email: tempEmail } }
          );
          console.log(`   ✅ ${user.uid} -> ${tempEmail}`);
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('🎉 Problema de emails duplicados resuelto!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmailDuplicates();