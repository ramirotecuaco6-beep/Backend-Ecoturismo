// routes/userRoutes.js
import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import UserPhoto from "../models/UserPhoto.js";
import User from "../models/User.js";

const router = express.Router();
console.log("✅ userRoutes.js cargado correctamente");

// ============================================================
// 🔹 CONFIGURACIÓN MULTER PARA ARCHIVOS EN MEMORIA (FOTOS + VIDEOS)
// ============================================================
const storage = multer.memoryStorage();

// 🔥 CORREGIDO: File filter mejorado que acepta por MIME type Y por extensión
const fileFilter = (req, file, cb) => {
  console.log('🔍 Verificando tipo de archivo:', {
    mimetype: file.mimetype,
    originalname: file.originalname
  });

  // Permitir cualquier archivo que tenga extensión de video/imagen
  const allowedExtensions = [
    // Imágenes
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    // Videos
    '.mov', '.mp4', '.webm', '.ogg', '.avi', '.3gp', '.mpeg', '.mkv', '.flv', '.wmv'
  ];
  
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (file.mimetype.startsWith("image/") || 
      file.mimetype.startsWith("video/") || 
      file.mimetype === 'application/octet-stream' ||
      allowedExtensions.includes(fileExtension)) {
    console.log('✅ Archivo aceptado:', {
      mimetype: file.mimetype,
      extension: fileExtension
    });
    return cb(null, true);
  }

  console.log('❌ Tipo de archivo no permitido:', {
    mimetype: file.mimetype,
    extension: fileExtension
  });
  cb(new Error("❌ Formato de archivo no soportado"), false);
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 500 * 1024 * 1024,
    files: 1
  },
  fileFilter,
});

// ============================================================
// 🔹 RUTA DE PRUEBA
// ============================================================
router.get("/test", (req, res) => {
  console.log("📥 GET /api/user/test");
  res.json({
    success: true,
    message: "Ruta /api/user/test funcionando correctamente 🚀",
    timestamp: new Date(),
  });
});

// ============================================================
// 🔹 SINCRONIZAR USUARIO (VERSIÓN SUPER ROBUSTA)
// ============================================================
router.post("/sync", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;

    console.log('🔄 Sincronizando usuario:', { uid, email, name });

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID de usuario no disponible'
      });
    }

    // Usar el método findOrCreate mejorado
    const user = await User.findOrCreate({
      uid: uid,
      email: email,
      name: name,
      picture: picture
    });

    console.log('✅ Usuario sincronizado exitosamente:', user.uid);

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.nombre,
        photoUrl: user.profilePhoto || user.avatar
      },
      message: 'Usuario sincronizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error en sync:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  Error de duplicado, detalles:', error.keyValue);
      
      // Estrategia de recuperación automática
      try {
        console.log('🔄 Intentando recuperación automática...');
        const { uid, email } = req.user;
        
        // Buscar el usuario existente
        const existingUser = await User.findOne({
          $or: [
            { uid: uid },
            { email: email }
          ]
        });
        
        if (existingUser) {
          return res.json({
            success: true,
            user: {
              uid: existingUser.uid,
              email: existingUser.email,
              displayName: existingUser.displayName || existingUser.nombre,
              photoUrl: existingUser.profilePhoto || existingUser.avatar
            },
            message: 'Usuario recuperado automáticamente'
          });
        }
      } catch (recoveryError) {
        console.error('❌ Error en recuperación:', recoveryError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error de duplicación en la base de datos',
        error: error.keyValue
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar usuario: ' + error.message
    });
  }
});

// ============================================================
// 🔹 GALERÍA PÚBLICA (sin token) - AHORA CON VIDEOS
// ============================================================
router.get("/all-photos", async (req, res) => {
  try {
    const photos = await UserPhoto.find({ isPublic: true }).sort({ uploadedAt: -1 });
    
    console.log(`📷 Galería pública: ${photos.length} medios (fotos + videos)`);
    
    res.json({ 
      success: true, 
      total: photos.length, 
      photos,
      // 🔥 NUEVO: Estadísticas de tipos
      stats: {
        images: photos.filter(p => p.mediaType === 'image').length,
        videos: photos.filter(p => p.mediaType === 'video').length
      }
    });
  } catch (err) {
    console.error("❌ Error cargando galería pública:", err);
    res.status(500).json({ success: false, error: "Error al cargar galería pública" });
  }
});

// ============================================================
// 🔹 GALERÍA PERSONAL (requiere autenticación) - AHORA CON VIDEOS
// ============================================================
router.get("/photos", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const photos = await UserPhoto.find({ userId: uid }).sort({ uploadedAt: -1 });
    
    console.log(`📷 Galería personal de ${uid}: ${photos.length} medios`);
    
    res.json({ 
      success: true, 
      total: photos.length, 
      photos,
      // 🔥 NUEVO: Estadísticas de tipos
      stats: {
        images: photos.filter(p => p.mediaType === 'image').length,
        videos: photos.filter(p => p.mediaType === 'video').length
      }
    });
  } catch (err) {
    console.error("❌ Error obteniendo fotos de galería:", err);
    res.status(500).json({ success: false, error: "Error al obtener las fotos" });
  }
});

// ============================================================
// 🔹 FOTO DE PERFIL (GET) - CORREGIDO
// ============================================================
router.get("/profile-photo", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ uid: uid });
    
    if (!user) {
      return res.json({ 
        success: true, 
        photo: null,
        message: "Usuario no encontrado" 
      });
    }
    
    res.json({ 
      success: true, 
      photo: user.profilePhoto || user.avatar || null 
    });
  } catch (err) {
    console.error("❌ Error al obtener foto de perfil:", err);
    res.status(500).json({ success: false, error: "Error al obtener foto de perfil" });
  }
});

// ============================================================
// 🔹 INFORMACIÓN DEL USUARIO
// ============================================================
router.get("/info", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ uid: uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.nombre,
        photoUrl: user.profilePhoto || user.avatar,
        fechaRegistro: user.fechaRegistro
      }
    });
  } catch (err) {
    console.error("❌ Error obteniendo información del usuario:", err);
    res.status(500).json({ success: false, error: "Error al obtener información" });
  }
});

// ============================================================
// 🔹 SUBIR MEDIA (FOTOS + VIDEOS) - VERSIÓN PARA VIDEOS LARGOS
// ============================================================
router.post("/upload-photo", verifyFirebaseToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No se recibió ningún archivo" 
      });
    }

    console.log('📸 Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    });

    // 🔥 NUEVO: Validación específica para videos largos
    const isVideo = req.file.mimetype.startsWith('video/') || req.file.mimetype === 'application/octet-stream';
    if (isVideo && req.file.size > 500 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "El video es demasiado grande. Máximo 500MB permitido."
      });
    }

    const uid = req.user.uid;
    const type = req.body.type || "gallery";
    
    // Determinar folder y resource_type basado en el tipo de archivo
    const folder = type === "profile" 
      ? "ecoturismo_perfiles" 
      : (isVideo ? "ecoturismo_videos" : "ecoturismo_uploads");
    
    const resourceType = isVideo ? "video" : "image";

    console.log('☁️ Subiendo a Cloudinary...', { 
      folder, 
      resourceType,
      isVideo,
      fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    // ☁️ CONFIGURACIÓN CLOUDINARY OPTIMIZADA PARA VIDEOS LARGOS
    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
      timeout: 300000, // 🔥 AUMENTADO A 5 MINUTOS para videos largos
      chunk_size: 10 * 1024 * 1024, // 🔥 AUMENTADO A 10MB chunks
    };

    // Para videos, agregar opciones específicas optimizadas
    if (isVideo) {
      uploadOptions.video_codec = "h264";
      uploadOptions.audio_codec = "aac";
      uploadOptions.quality = "auto:good";
      uploadOptions.bit_rate = "1500k"; // 🔥 Bitrate controlado para calidad/tiempo balance
      
      // 🔥 NUEVO: Configuración para videos largos
      uploadOptions.eager_async = true; // Procesamiento asíncrono
      uploadOptions.eager_notification_url = null; // Sin notificación (más simple)
    }

    console.log('⚙️ Opciones de Cloudinary:', uploadOptions);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Error Cloudinary:', error);
            
            // 🔥 MEJORES MENSAJES DE ERROR
            if (error.message.includes('File size too large')) {
              reject(new Error('Cloudinary: El archivo es demasiado grande para el plan actual'));
            } else if (error.message.includes('timeout')) {
              reject(new Error('Cloudinary: Tiempo de espera agotado. El video es muy largo.'));
            } else if (error.message.includes('Duration too long')) {
              reject(new Error('Cloudinary: El video es demasiado largo para el plan actual'));
            } else {
              reject(new Error(`Cloudinary: ${error.message}`));
            }
          } else {
            console.log('✅ Upload Cloudinary exitoso:', {
              url: result.secure_url,
              type: result.resource_type,
              size: (result.bytes / (1024 * 1024)).toFixed(2) + ' MB',
              format: result.format,
              duration: result.duration,
              duration_formatted: result.duration ? `${Math.floor(result.duration / 60)}:${Math.floor(result.duration % 60).toString().padStart(2, '0')}` : 'N/A'
            });
            resolve(result);
          }
        }
      );

      uploadStream.on('error', (streamError) => {
        console.error('❌ Error en stream de upload:', streamError);
        reject(new Error('Error en el proceso de upload: ' + streamError.message));
      });

      // 🔥 MEJOR MANEJO DEL STREAM PARA ARCHIVOS GRANDES
      try {
        uploadStream.end(req.file.buffer);
      } catch (streamError) {
        console.error('❌ Error escribiendo en el stream:', streamError);
        reject(new Error('Error procesando el archivo: ' + streamError.message));
      }
    });

    console.log('✅ Media subido a Cloudinary:', result.secure_url);

    // 🔥 NUEVO: Determinar el tipo de media para guardar en BD
    const mediaType = result.resource_type === 'video' ? 'video' : 'image';

    if (type === "profile") {
      // Para perfil, solo permitir imágenes
      if (mediaType === 'video') {
        return res.status(400).json({
          success: false,
          error: "Los videos no pueden usarse como foto de perfil"
        });
      }

      // Usar findOrCreate para manejar usuario existente o nuevo
      const user = await User.findOrCreate({
        uid: uid,
        email: req.user.email,
        name: req.user.name,
        picture: result.secure_url
      });

      // Actualizar foto de perfil
      user.profilePhoto = result.secure_url;
      user.avatar = result.secure_url;
      await user.save();

      return res.json({
        success: true,
        message: "✅ Foto de perfil actualizada correctamente",
        photoUrl: result.secure_url,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.profilePhoto
        }
      });
    }

    // Guardar en UserPhoto para galería (fotos y videos)
    const newMedia = new UserPhoto({
      userId: uid,
      url: result.secure_url,
      publicId: result.public_id,
      type: "gallery",
      mediaType: mediaType, // 🔥 NUEVO: 'image' o 'video'
      description: req.body.description || (mediaType === 'video' ? "Video subido por el usuario" : "Foto subida por el usuario"),
      location: req.body.location || "No especificada",
      isPublic: req.body.isPublic !== 'false', // Por defecto true
      uploadedAt: new Date(),
      cloudinaryData: {
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration, // ⭐ Solo para videos
        video_codec: result.video_codec, // ⭐ Solo para videos
        duration_formatted: result.duration ? `${Math.floor(result.duration / 60)}:${Math.floor(result.duration % 60).toString().padStart(2, '0')}` : null
      },
    });

    await newMedia.save();

    res.json({
      success: true,
      message: mediaType === 'video' 
        ? `✅ Video subido correctamente (${newMedia.cloudinaryData.duration_formatted || 'Duración no disponible'})` 
        : "✅ Foto subida correctamente a la galería",
      photo: newMedia,
      mediaType: mediaType // 🔥 NUEVO: Para que el frontend sepa qué tipo es
    });

  } catch (err) {
    console.error("❌ Error al subir media:", err);
    
    let errorMessage = "Error al subir el archivo";
    if (err.message.includes('File size too large')) {
      errorMessage = "El archivo es demasiado grande. Máximo 500MB permitido.";
    } else if (err.message.includes('timeout')) {
      errorMessage = "La subida tardó demasiado. Intenta con un video más corto o comprime el archivo.";
    } else if (err.message.includes('Duration too long')) {
      errorMessage = "El video es demasiado largo. Máximo 10 minutos recomendado.";
    } else if (err.message.includes('Cloudinary')) {
      errorMessage = "Error del servicio de almacenamiento: " + err.message.replace('Cloudinary: ', '');
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
  }
});

// ============================================================
// 🔹 ACTUALIZAR FOTO DE PERFIL DIRECTAMENTE (SOLO IMÁGENES)
// ============================================================
router.post("/update-profile-photo", verifyFirebaseToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "Falta el archivo de imagen" 
      });
    }

    // Validar que sea imagen, no video
    if (req.file.mimetype.startsWith('video/') || req.file.mimetype === 'application/octet-stream') {
      return res.status(400).json({
        success: false,
        error: "Los videos no pueden usarse como foto de perfil"
      });
    }

    const uid = req.user.uid;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "ecoturismo_perfiles" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    // Usar findOrCreate para mayor robustez
    const user = await User.findOrCreate({
      uid: uid,
      email: req.user.email,
      name: req.user.name,
      picture: result.secure_url
    });

    // Actualizar foto
    user.profilePhoto = result.secure_url;
    user.avatar = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: "✅ Foto de perfil actualizada correctamente",
      profilePhoto: result.secure_url,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.profilePhoto
      }
    });
  } catch (err) {
    console.error("❌ Error al actualizar foto de perfil:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al actualizar la foto de perfil" 
    });
  }
});

// ============================================================
// 🔹 ELIMINAR MEDIA DE GALERÍA (FOTOS + VIDEOS)
// ============================================================
router.delete("/photos/:photoId", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const photoId = req.params.photoId;

    const photo = await UserPhoto.findOne({ _id: photoId, userId: uid });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Media no encontrado o no tienes permisos"
      });
    }

    // Eliminar de Cloudinary - usar resource_type correcto
    const resourceType = photo.mediaType === 'video' ? 'video' : 'image';
    await cloudinary.uploader.destroy(photo.publicId, { resource_type: resourceType });

    // Eliminar de la base de datos
    await UserPhoto.findByIdAndDelete(photoId);

    res.json({
      success: true,
      message: `✅ ${photo.mediaType === 'video' ? 'Video' : 'Foto'} eliminado correctamente`
    });
  } catch (err) {
    console.error("❌ Error eliminando media:", err);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el media"
    });
  }
});

// ============================================================
// 🔹 ACTUALIZAR MEDIA DE GALERÍA (FOTOS + VIDEOS)
// ============================================================
router.put("/photos/:photoId", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const photoId = req.params.photoId;
    const { description, location, isPublic } = req.body;

    console.log('🔄 Actualizando media:', { photoId, uid, description, location });

    const photo = await UserPhoto.findOne({ _id: photoId, userId: uid });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Media no encontrado o no tienes permisos"
      });
    }

    // Actualizar campos
    if (description !== undefined) photo.description = description;
    if (location !== undefined) photo.location = location;
    if (isPublic !== undefined) photo.isPublic = isPublic;
    
    photo.updatedAt = new Date();

    await photo.save();

    console.log('✅ Media actualizado correctamente');

    res.json({
      success: true,
      message: `✅ ${photo.mediaType === 'video' ? 'Video' : 'Foto'} actualizado correctamente`,
      photo: photo
    });
  } catch (err) {
    console.error("❌ Error actualizando media:", err);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el media"
    });
  }
});

// ============================================================
// 🔹 LIMPIAR USUARIOS TEMPORALES (para administración)
// ============================================================
router.delete("/cleanup-temp-users", verifyFirebaseToken, async (req, res) => {
  try {
    const result = await User.cleanupTempUsers();
    res.json({
      success: true,
      message: `Limpieza completada. ${result?.deletedCount || 0} usuarios temporales eliminados.`
    });
  } catch (err) {
    console.error("❌ Error en limpieza:", err);
    res.status(500).json({
      success: false,
      error: "Error al limpiar usuarios temporales"
    });
  }
});

export default router;