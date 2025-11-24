// routes/users.js (NUEVO ARCHIVO - para MongoDB Atlas)
import express from "express";
import User from "../models/User.js";

const router = express.Router();

console.log("✅ Rutas de users/logros (MongoDB) cargadas correctamente");

// 🔥 CREAR USUARIO (para el registro desde frontend)
router.post("/", async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, logros } = req.body;
    
    console.log('🆕 Creando usuario en MongoDB:', { uid, email });

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID y email son requeridos'
      });
    }

    // Usar findOrCreate para evitar duplicados
    const user = await User.findOrCreate({
      uid: uid,
      email: email,
      name: displayName,
      picture: photoURL
    });

    console.log('✅ Usuario procesado en MongoDB:', user._id);

    res.status(201).json({
      success: true,
      user: {
        uid: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        logros: user.logros || []
      },
      message: 'Usuario creado/actualizado en MongoDB correctamente'
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario: ' + error.message
    });
  }
});

// 🔥 OBTENER USUARIO POR UID
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('🔍 Obteniendo usuario:', uid);
    
    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        uid: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        logros: user.logros || [],
        fechaRegistro: user.fechaRegistro
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario: ' + error.message
    });
  }
});

// 🔥 AGREGAR LOGRO
router.post("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    const achievementData = req.body;
    
    console.log('🎯 Agregando logro a usuario:', uid, achievementData);

    if (!achievementData.id || !achievementData.nombre) {
      return res.status(400).json({
        success: false,
        message: 'ID y nombre del logro son requeridos'
      });
    }

    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.addAchievement(achievementData);

    res.json({
      success: true,
      message: 'Logro agregado correctamente',
      logros: user.logros
    });

  } catch (error) {
    console.error('❌ Error agregando logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar logro: ' + error.message
    });
  }
});

// 🔥 ACTUALIZAR TODOS LOS LOGROS
router.put("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    const { logros } = req.body;
    
    console.log('🔄 Actualizando todos los logros para usuario:', uid);

    if (!Array.isArray(logros)) {
      return res.status(400).json({
        success: false,
        message: 'El campo logros debe ser un array'
      });
    }

    const user = await User.findByIdAndUpdate(
      uid,
      { 
        logros: logros,
        ultimaConexion: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Logros actualizados correctamente',
      logros: user.logros
    });

  } catch (error) {
    console.error('❌ Error actualizando logros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar logros: ' + error.message
    });
  }
});

// 🔥 OBTENER LOGROS DEL USUARIO
router.get("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('📊 Obteniendo logros del usuario:', uid);
    
    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const logrosCompletados = user.getCompletedAchievements();

    res.json({
      success: true,
      logros: user.logros || [],
      estadisticas: {
        total: user.logros.length,
        completados: logrosCompletados.length,
        progreso: user.logros.length > 0 ? (logrosCompletados.length / user.logros.length) * 100 : 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo logros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logros: ' + error.message
    });
  }
});

export default router;