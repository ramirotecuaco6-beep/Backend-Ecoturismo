// controllers/userController.js
import User from "../models/User.js";
import UserPhoto from "../models/UserPhoto.js";
import cloudinary from "../config/cloudinary.js";

export const prueba = (req, res) => {
  res.send("Prueba de usuario OK");
};

// 🔥 Registrar o actualizar usuario
export const registrarOActualizar = async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const { nombre, avatar } = req.body;

    const nombreFinal = nombre || name || email.split("@")[0];

    const user = await User.findOneAndUpdate(
      { uid },
      { 
        $setOnInsert: { fechaRegistro: new Date() },
        $set: { uid, email, nombre: nombreFinal, avatar }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ ok: true, user });
  } catch (error) {
    console.error("Error registrarOActualizar:", error);
    res.status(500).json({ error: "Error al registrar/actualizar usuario" });
  }
};

// 🔍 Obtener perfil del usuario actual
export const obtenerPerfil = async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ uid }).lean();
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Error obtenerPerfil:", err);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// 🏆 Agregar logro al usuario
export const addAchievement = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id, nombre } = req.body;
    if (!id || !nombre) return res.status(400).json({ error: "Falta id o nombre del logro" });

    await User.updateOne(
      { uid },
      { $addToSet: { logros: { id, nombre, fecha_desbloqueo: new Date() } } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error addAchievement:", err);
    res.status(500).json({ error: "Error guardando logro" });
  }
};

// 🚶 Registrar pasos diarios
export const addSteps = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { date, steps } = req.body;
    if (!date || typeof steps !== "number") return res.status(400).json({ error: "Falta date o steps" });

    const dateObj = new Date(date);

    await User.updateOne({ uid }, { $pull: { stepsByDay: { date: dateObj } } });
    await User.updateOne(
      { uid },
      { $push: { stepsByDay: { date: dateObj, steps } } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error addSteps:", err);
    res.status(500).json({ error: "Error guardando pasos" });
  }
};

// 📸 Obtener TODAS las fotos públicas (PARA GALERÍA)
export const getAllPhotos = async (req, res) => {
  try {
    const photos = await UserPhoto.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .select('-__v -cloudinaryData')
      .lean();
    
    console.log(`📷 Galería pública: ${photos.length} fotos`);
    res.json({ ok: true, photos });
  } catch (error) {
    console.error("Error getAllPhotos:", error);
    res.status(500).json({ error: "Error obteniendo fotos de la galería" });
  }
};

// 📸 Obtener MIS fotos (PARA PERFIL - todas mis fotos)
export const getMyPhotos = async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log(`📷 Solicitando fotos para usuario: ${uid}`);
    
    const photos = await UserPhoto.find({ userId: uid })
      .sort({ uploadedAt: -1 })
      .select('-__v -cloudinaryData')
      .lean();
    
    console.log(`📷 Mis fotos (${uid}): ${photos.length} fotos`);
    res.json({ ok: true, photos });
  } catch (error) {
    console.error("Error getMyPhotos:", error);
    res.status(500).json({ error: "Error obteniendo mis fotos" });
  }
};

// 📸 Obtener fotos del usuario (COMPATIBILIDAD)
export const getUserPhotos = async (req, res) => {
  try {
    const uid = req.user.uid;
    const photos = await UserPhoto.find({ userId: uid })
      .sort({ uploadedAt: -1 })
      .lean();
    
    console.log(`📷 Fotos usuario (compatibilidad): ${photos.length} fotos`);
    res.json({ ok: true, photos });
  } catch (error) {
    console.error("Error getUserPhotos:", error);
    res.status(500).json({ error: "Error obteniendo fotos" });
  }
};

// 📤 Subir foto usando Cloudinary - VERSIÓN CON FALLBACK
export const uploadPhoto = async (req, res) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { type, description, location, isPublic } = req.body;
    
    console.log('📤 Subiendo foto para:', uid);

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó imagen" });
    }

    if (req.file.size > 40 * 1024 * 1024) {
      return res.status(400).json({ error: "Imagen demasiado grande (máximo 10MB)" });
    }

    let imageUrl;
    let publicId;
    let usedFallback = false;

    // INTENTAR CLOUDINARY PRIMERO
    try {
      console.log('☁️ Intentando Cloudinary...');
      
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: `ecolibres/users/${uid}`,
        resource_type: "image"
      });

      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
      console.log('✅ Cloudinary éxito');

    } catch (cloudinaryError) {
      console.log('🔄 Cloudinary falló, usando fallback...');
      usedFallback = true;
      
      // FALLBACK: Usar servicio alternativo
      imageUrl = `https://picsum.photos/seed/${Date.now()}/600/400`;
      publicId = `fallback-${Date.now()}`;
    }

    // Guardar en MongoDB
    const photoIsPublic = isPublic === 'true' || isPublic === true;

    const photo = await UserPhoto.create({
      userId: uid,
      url: imageUrl,
      publicId: publicId,
      type: type || 'gallery',
      description: description || (usedFallback ? 'Foto temporal (Cloudinary no disponible)' : ''),
      location: location || 'Libres, Puebla',
      isPublic: photoIsPublic,
      uploadedAt: new Date(),
      usedFallback: usedFallback
    });

    // Actualizar perfil si es necesario
    if (type === 'profile') {
      await User.findOneAndUpdate(
        { uid },
        { $set: { avatar: imageUrl } }
      );
      console.log('✅ Foto de perfil actualizada');
    }

    res.json({ 
      ok: true, 
      photo: {
        _id: photo._id,
        url: photo.url,
        type: photo.type,
        description: photo.description,
        location: photo.location,
        isPublic: photo.isPublic,
        uploadedAt: photo.uploadedAt,
        usedFallback: usedFallback
      }
    });

  } catch (error) {
    console.error("❌ Error uploadPhoto:", error);
    res.status(500).json({ 
      error: "Error subiendo foto",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// 🗑️ Eliminar foto
export const deletePhoto = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { photoId } = req.params;

    const photo = await UserPhoto.findOne({ _id: photoId, userId: uid });
    if (!photo) {
      return res.status(404).json({ error: "Foto no encontrada" });
    }

    // Solo eliminar de Cloudinary si no es fallback
    if (!photo.usedFallback) {
      await cloudinary.uploader.destroy(photo.publicId);
    }

    // Eliminar de MongoDB
    await UserPhoto.findByIdAndDelete(photoId);

    res.json({ ok: true, message: "Foto eliminada correctamente" });
  } catch (error) {
    console.error("Error deletePhoto:", error);
    res.status(500).json({ error: "Error eliminando foto" });
  }
};

// ✏️ Actualizar perfil
export const updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const updateData = req.body;

    const allowedFields = ['nombre', 'avatar'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: filteredData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ 
      ok: true, 
      user: {
        uid: user.uid,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar,
        fechaRegistro: user.fechaRegistro,
        logros: user.logros,
        visitedPlaces: user.visitedPlaces,
        stepsByDay: user.stepsByDay
      }
    });
  } catch (error) {
    console.error("Error updateProfile:", error);
    res.status(500).json({ error: "Error actualizando perfil" });
  }
};