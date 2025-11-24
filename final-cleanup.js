import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function finalCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB...');
    
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // 1. ELIMINAR TODOS LOS ÍNDICES PROBLEMÁTICOS
    console.log('🗑️  Eliminando todos los índices problemáticos...');
    
    const indexes = await users.indexes();
    console.log('📋 Índices actuales:', indexes.map(idx => idx.name));
    
    // Eliminar índices problemáticos
    const problematicIndexes = ['firebaseId_1', 'uid_1', 'email_1'];
    
    for (const indexName of problematicIndexes) {
      try {
        await users.dropIndex(indexName);
        console.log(`✅ Índice eliminado: ${indexName}`);
      } catch (e) {
        console.log(`ℹ️  Índice ${indexName} no existe o ya fue eliminado`);
      }
    }
    
    // 2. ELIMINAR TODOS LOS DOCUMENTOS PROBLEMÁTICOS
    console.log('🧹 Eliminando documentos problemáticos...');
    
    const deleteResult = await users.deleteMany({
      $or: [
        { uid: null },
        { firebaseId: { $exists: true } },
        { email: null }
      ]
    });
    
    console.log(`✅ ${deleteResult.deletedCount} documentos problemáticos eliminados`);
    
    // 3. CREAR NUEVOS ÍNDICES SPARSE
    console.log('🔄 Creando nuevos índices sparse...');
    
    await users.createIndex({ uid: 1 }, { 
      unique: true, 
      sparse: true,
      name: 'uid_1' 
    });
    
    await users.createIndex({ email: 1 }, { 
      unique: true, 
      sparse: true,
      name: 'email_1' 
    });
    
    console.log('✅ Nuevos índices sparse creados');
    
    // 4. VERIFICAR ESTADO FINAL
    const finalIndexes = await users.indexes();
    console.log('\n🎉 ÍNDICES FINALES:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: unique=${idx.unique}, sparse=${idx.sparse}`);
    });
    
    const totalUsers = await users.countDocuments();
    console.log(`\n📊 Total de usuarios: ${totalUsers}`);
    
    await mongoose.disconnect();
    console.log('\n✨ LIMPIEZA COMPLETADA! El sistema está listo.');
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  }
}

finalCleanup();