// utils/testCloudinary.js
import cloudinary from '../config/cloudinary.js';

const testCloudinary = async () => {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Variables de entorno de Cloudinary no configuradas');
      return false;
    }

    console.log('🔍 Probando conexión con Cloudinary...');
    console.log('📊 Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('🔑 API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurada' : '❌ Faltante');
    console.log('🔒 API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurada' : '❌ Faltante');
    
    // Probar una operación simple de Cloudinary
    const result = await cloudinary.api.ping();
    
    console.log('✅ Conexión con Cloudinary exitosa!');
    console.log('📊 Respuesta:', result);
    return true;
  } catch (error) {
    console.error('❌ Error conectando con Cloudinary:', error.message);
    
    // Información útil para debugging
    if (error.message && error.message.includes('Invalid cloud_name')) {
      console.log('💡 Revisa CLOUDINARY_CLOUD_NAME en .env');
    } else if (error.message && error.message.includes('Invalid credentials')) {
      console.log('💡 Revisa CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env');
    } else if (error.message && error.message.includes('Cannot read properties of undefined')) {
      console.log('💡 Error en el código de testCloudinary. Revisa la sintaxis.');
    }
    
    return false;
  }
};

export default testCloudinary;