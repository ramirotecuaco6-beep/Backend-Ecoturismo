import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function finalMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB...');
    
    const users = mongoose.connection.collection('users');
    
    // 1. Eliminar documentos completamente inconsistentes
    const result = await users.deleteMany({
      $or: [
        { uid: null },
        { uid: { $exists: false } },
        { firebaseId: { $exists: true } } // Eliminar documentos con el campo viejo
      ]
    });
    
    console.log(`🗑️  ${result.deletedCount} documentos inconsistentes eliminados`);
    
    // 2. Renombrar firebaseId a uid si existe
    try {
      await users.updateMany(
        { firebaseId: { $exists: true } },
        { $rename: { "firebaseId": "uid" } }
      );
      console.log('✅ Campos firebaseId renombrados a uid');
    } catch (e) {
      console.log('ℹ️  No hay campos firebaseId para renombrar');
    }
    
    // 3. Verificar estado final
    const totalUsers = await users.countDocuments();
    const nullUidUsers = await users.countDocuments({ uid: null });
    const withUidUsers = await users.countDocuments({ uid: { $ne: null } });
    
    console.log('\n📊 ESTADO FINAL:');
    console.log(`   👥 Total usuarios: ${totalUsers}`);
    console.log(`   ✅ Con UID válido: ${withUidUsers}`);
    console.log(`   ❌ Con UID null: ${nullUidUsers}`);
    
    await mongoose.disconnect();
    console.log('\n🎉 Migración completada! El sistema está listo para múltiples usuarios.');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

finalMigration();