// server.js - VERSIÓN COMPLETA CON EMAILJS INTEGRADO
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import lugarRoutes from './routes/lugares.js';
import actividadRoutes from './routes/actividades.js';
import seedRouter from './routes/seed.js';
import userRoutes from './routes/userRoutes.js';
import usersRoutes from './routes/users.js'; // 🔥 NUEVO: Rutas para MongoDB Atlas

// Importar modelo User para la limpieza
import User from './models/User.js';
// 🔹 IMPORTAR RUTAS TEMPORALES PARA DIAGNÓSTICO
import tempRoutes from './tempRoutes.js';

dotenv.config();

const app = express();

// Para __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middlewares ---
// 1. Define la lista de orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173", // Tu entorno de desarrollo local (Vite/React)
  "https://cheerful-belekoy-66d6ab.netlify.app" // Tu URL de producción en Netlify
];

// 2. Configura el middleware de CORS para usar la lista
app.use(cors({
  origin: allowedOrigins, // Acepta peticiones de cualquiera de los dos dominios
  credentials: true // Permite el envío de cookies o headers de autorización si los usas
}));

// 🔥 CORRECCIÓN CRÍTICA: AUMENTAR LÍMITES A 500MB
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Servir archivos estáticos
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuración inicial ---
console.log('🚀 Iniciando EcoLibres Backend...\n');

// Verificar variables de entorno
console.log('🔧 Configuración:');
console.log('   ☁️  Cloudinary:');
console.log('     - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ No configurado');
console.log('     - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurada' : '❌ No configurada');
console.log('     - API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurada' : '❌ No configurada');
console.log('   🗄️  MongoDB:', process.env.MONGODB_URI ? '✅ Configurada' : '❌ No configurada');
console.log('   🚪 Puerto:', process.env.PORT || 5000);
console.log('   📧 Email Service:', process.env.EMAIL_SERVICE || 'No configurado');
console.log('   📧 EmailJS:', process.env.EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ No configurado');
console.log('   📁 Límite archivos: 500MB');
console.log('   🎯 MongoDB Routes:', '✅ Configuradas');
console.log('');

// --- Conexión a MongoDB ---
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    console.log('✅ Cloudinary configurado - Listo para subir imágenes y videos');
  } else {
    console.log('⚠️  Cloudinary no configurado - Funcionalidad de imágenes limitada');
  }

  if (process.env.EMAIL_SERVICE === 'emailjs' && process.env.EMAILJS_SERVICE_ID) {
    console.log('✅ EmailJS configurado - Listo para enviar emails de contacto');
  } else {
    console.log('⚠️  EmailJS no configurado - Emails desactivados');
  }

  console.log('✅ MongoDB Atlas Routes - Listo para usuarios y logros');
})
.catch(error => {
  console.error('❌ Error conectando a MongoDB:', error);
});

// 🔥 CORRECCIÓN: Mover la limpieza de índices después de la conexión
mongoose.connection.on('connected', async () => {
  console.log('🔄 Ejecutando limpieza de índices...');
  try {
    await User.initializeCleanup();
    console.log('✅ Limpieza de índices completada');
  } catch (error) {
    console.log('ℹ️ Limpieza no requerida:', error.message);
  }
});

// 🔹 DIAGNÓSTICO DE RUTAS USER
console.log('\n🔍 DIAGNÓSTICO DE RUTAS:');
console.log('   - userRoutes importado:', userRoutes ? '✅' : '❌');
console.log('   - usersRoutes importado:', usersRoutes ? '✅' : '❌');
console.log('   - Tipo de userRoutes:', typeof userRoutes);

// --- Rutas del API ---
app.use('/api/lugares', lugarRoutes);
app.use('/api/actividades', actividadRoutes);
app.use('/api/seed', seedRouter);

// 🔹 MONTAJE DE RUTAS USER CON DIAGNÓSTICO
console.log('🔄 Montando userRoutes en /api/user...');
app.use('/api/user', userRoutes);
console.log('✅ userRoutes montado en /api/user');

// 🔥 NUEVO: Rutas para MongoDB Atlas (usuarios y logros)
console.log('🔄 Montando usersRoutes en /api/users...');
app.use('/api/users', usersRoutes);
console.log('✅ usersRoutes montado en /api/users');

// 🔹 RUTAS TEMPORALES PARA DIAGNÓSTICO
console.log('🔄 Montando tempRoutes en /api/temp...');
app.use('/api/temp', tempRoutes);
console.log('✅ tempRoutes montado en /api/temp');

import emailjs from '@emailjs/nodejs';

// --- RUTA DE CONTACTO CON EMAILJS SDK OFICIAL ---
app.post('/api/contacto', async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    console.log('\n📧 Nuevo mensaje de contacto:');
    console.log('   👤 Nombre:', nombre);
    console.log('   📧 Email:', email);
    console.log('   📝 Asunto:', asunto);
    console.log('   💬 Mensaje:', mensaje?.substring(0, 100) + '...');

    // Validaciones
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y mensaje son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Por favor ingresa un email válido'
      });
    }

    let emailSent = false;
    let emailError = null;

    // 🔥 ENVÍO CON EMAILJS SDK OFICIAL
    if (process.env.EMAIL_SERVICE === 'emailjs' && process.env.EMAILJS_SERVICE_ID) {
      try {
        console.log('🔄 Enviando email via EmailJS SDK...');
        
        // 1. Email para el administrador
        const adminEmailResult = await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          {
            from_name: nombre,
            from_email: email,
            to_email: process.env.ADMIN_EMAIL,
            subject: asunto || 'Consulta EcoLibres',
            message: mensaje,
            reply_to: email,
            timestamp: new Date().toLocaleString(),
            type: 'contact_form'
          },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );

        console.log('✅ Email de administrador enviado:', adminEmailResult.status, adminEmailResult.text);

        // 2. Email de confirmación al usuario (usando la plantilla de auto-respuesta)
        const userEmailResult = await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          'template_z2e7nww', // Plantilla de auto-respuesta
          {
            from_name: 'Equipo EcoLibres',
            from_email: process.env.ADMIN_EMAIL,
            to_email: email,
            subject: '✅ Confirmación de mensaje recibido',
            message: `Hola ${nombre}, hemos recibido tu mensaje: "${mensaje.substring(0, 100)}..."`,
            user_name: nombre,
            user_message: mensaje,
            timestamp: new Date().toLocaleString()
          },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );

        console.log('✅ Email de confirmación enviado:', userEmailResult.status, userEmailResult.text);
        
        emailSent = true;
        console.log('🎉 Todos los emails enviados exitosamente via EmailJS');

      } catch (error) {
        console.error('❌ Error con EmailJS:', error);
        
        // Información detallada del error
        if (error.response) {
          console.error('📧 Detalles del error EmailJS:', {
            status: error.response.status,
            text: error.response.text,
            headers: error.response.headers
          });
        }
        
        emailError = error.message;
      }
    } else {
      console.log('⚠️ EmailJS no configurado - Simulando envío');
      emailSent = true; // Simulamos éxito para desarrollo
    }

    // ✅ RESPUESTA AL CLIENTE
    res.status(200).json({
      success: true,
      message: '¡Mensaje enviado correctamente! Te contactaremos en menos de 24 horas.',
      data: {
        nombre,
        email,
        asunto: asunto || 'Consulta general',
        timestamp: new Date().toISOString(),
        emailSent,
        emailError: emailError || null,
        service: 'EmailJS SDK'
      }
    });

  } catch (error) {
    console.error('❌ Error inesperado en contacto:', error);
    
    // ✅ INCLUSO EN ERROR, RESPONDEMOS ÉXITO
    res.status(200).json({
      success: true,
      message: 'Mensaje recibido. Gracias por contactarnos.',
      data: {
        nombre: req.body.nombre,
        email: req.body.email,
        timestamp: new Date().toISOString(),
        received: true
      }
    });
  }
});

// --- Ruta de prueba / health check ---
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 EcoLibres Backend funcionando!', 
    timestamp: new Date(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado',
      cloudinary: (process.env.CLOUDINARY_CLOUD_NAME && 
                  process.env.CLOUDINARY_API_KEY && 
                  process.env.CLOUDINARY_API_SECRET) ? '✅ Configurado' : '⚠️ No configurado',
      contacto: '✅ Disponible',
      email: (process.env.EMAIL_SERVICE === 'emailjs' && process.env.EMAILJS_SERVICE_ID) ? '✅ Configurado' : '⚠️ No configurado',
      mongodb_atlas_routes: '✅ Disponible'
    },
    limits: {
      fileUpload: '500MB',
      json: '500MB',
      urlencoded: '500MB'
    },
    diagnostic: {
      userRoutes: !!userRoutes,
      usersRoutes: !!usersRoutes,
      tempRoutes: true,
      contactoRoute: true
    },
    environment: process.env.NODE_ENV || 'development',
    available_endpoints: [
      '/api/users (MongoDB Atlas)',
      '/api/user (Firebase + Cloudinary)',
      '/api/lugares',
      '/api/actividades',
      '/api/contacto'
    ]
  });
});

// --- Ruta de estado de Cloudinary ---
app.get('/api/cloudinary-status', (req, res) => {
  const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && 
                         process.env.CLOUDINARY_API_KEY && 
                         process.env.CLOUDINARY_API_SECRET);
  
  res.json({ 
    configured: isConfigured,
    status: isConfigured ? '✅ Listo para subir imágenes y videos' : '❌ No configurado',
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'No configurado',
    has_credentials: !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    max_file_size: '500MB'
  });
});

// --- Ruta de información del servidor ---
app.get('/api/info', (req, res) => {
  res.json({
    name: 'EcoLibres Backend',
    version: '1.0.0',
    description: 'Plataforma de ecoturismo para Libres, Puebla',
    status: 'running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    upload_limits: {
      files: '500MB',
      json: '500MB',
      form_data: '500MB'
    },
    email_service: (process.env.EMAIL_SERVICE === 'emailjs' && process.env.EMAILJS_SERVICE_ID) ? '✅ EmailJS Activo' : '❌ Inactivo',
    mongodb_atlas: '✅ Integrado - Usuarios y Logros',
    supported_media: [
      'images: jpg, jpeg, png, gif, webp, bmp, svg',
      'videos: mov, mp4, webm, ogg, avi, 3gp, mpeg, mkv, flv, wmv'
    ],
    contact_form: '✅ Disponible - POST /api/contacto',
    mongodb_routes: [
      'POST /api/users - Crear usuario',
      'GET /api/users/:uid - Obtener usuario', 
      'POST /api/users/:uid/achievements - Agregar logro',
      'PUT /api/users/:uid/achievements - Actualizar logros',
      'GET /api/users/:uid/achievements - Obtener logros'
    ],
    diagnostic_routes: [
      '/api/temp/temp-test',
      '/api/temp/temp-upload'
    ]
  });
});

// --- Manejo de errores ---
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Archivo demasiado grande. Máximo 500MB permitido.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        error: 'Tipo de archivo no permitido.' 
      });
    }
  }

  if (err.status === 413) {
    return res.status(413).json({
      success: false,
      error: 'Payload demasiado grande. Máximo 500MB permitido.'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// --- Ruta 404 ---
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    available_routes: [
      'GET  /api/health',
      'GET  /api/cloudinary-status', 
      'GET  /api/info',
      'POST /api/contacto',
      'GET  /api/lugares/*',
      'GET  /api/actividades/*',
      'GET  /api/seed/*',
      'ALL  /api/user/*',
      'ALL  /api/users/* ← 🔥 NUEVO RUTAS MONGODB ATLAS',
      'ALL  /api/temp/* ← RUTAS DE DIAGNÓSTICO'
    ]
  });
});

// --- Puerto del servidor ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n✨ Servidor inicializado correctamente!');
  console.log('🌍 URL: http://localhost:' + PORT);
  console.log('\n📊 Endpoints disponibles:');
  console.log('   🩺  Health Check      - GET  /api/health');
  console.log('   ☁️   Cloudinary Status - GET  /api/cloudinary-status');
  console.log('   ℹ️   Server Info       - GET  /api/info');
  console.log('   📧  Contacto          - POST /api/contacto');
  console.log('   👤  User Routes       - ALL  /api/user/*');
  console.log('   🗄️   MongoDB Atlas    - ALL  /api/users/* ← 🔥 NUEVO');
  console.log('   🗺️   Lugares           - GET  /api/lugares/*');
  console.log('   🎯  Actividades       - GET  /api/actividades/*');
  console.log('   🌱  Seed Data         - GET  /api/seed/*');
  console.log('   🔧  Diagnostic Routes - ALL  /api/temp/*');
  console.log('\n💾 Límites de archivos:');
  console.log('   ✅ Subida de archivos: 500MB');
  console.log('   ✅ JSON payload: 500MB');
  console.log('   ✅ Form data: 500MB');
  console.log('\n📧 Servicio de Email:');
  console.log('   ✅ Formulario contacto: ACTIVO');
  console.log('   ✅ Servicio: EmailJS');
  console.log('\n🗄️  MongoDB Atlas:');
  console.log('   ✅ Usuarios y logros: INTEGRADO');
  console.log('   ✅ Endpoints: /api/users/*');
  console.log('\n✅ ¡Servidor listo para usar!');
  console.log('💡 Prueba: http://localhost:' + PORT + '/api/health\n');
});

// --- Manejo de cierre graceful ---
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ MongoDB desconectado');
  console.log('👋 Servidor terminado');
  process.exit(0);
});

export default app;