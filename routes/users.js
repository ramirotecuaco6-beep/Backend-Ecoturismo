// routes/users.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

console.log("Rutas de users/logros (MongoDB) cargadas correctamente");

// CREAR USUARIO (para el registro desde frontend)
router.post("/", async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, logros } = req.body;
    
    console.log('Creando usuario en MongoDB:', { uid, email });

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

    console.log('Usuario procesado en MongoDB:', user._id);

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
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario: ' + error.message
    });
  }
});

// OBTENER USUARIO POR UID
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('Obteniendo usuario:', uid);
    
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
        fechaRegistro: user.fechaRegistro,
        rutasCompletadas: user.rutasCompletadas || [] // AGREGADO
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario: ' + error.message
    });
  }
});

// AGREGAR LOGRO
router.post("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    const achievementData = req.body;
    
    console.log('Agregando logro a usuario:', uid, achievementData);

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
    console.error('Error agregando logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar logro: ' + error.message
    });
  }
});

// ACTUALIZAR TODOS LOS LOGROS
router.put("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    const { logros } = req.body;
    
    console.log('Actualizando todos los logros para usuario:', uid);

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
    console.error('Error actualizando logros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar logros: ' + error.message
    });
  }
});

// OBTENER LOGROS DEL USUARIO
router.get("/:uid/achievements", async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('Obteniendo logros del usuario:', uid);
    
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
    console.error('Error obteniendo logros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logros: ' + error.message
    });
  }
});

// GUARDAR RUTA COMPLETADA (para el mapa de calor)
router.post("/:uid/rutas-completadas", async (req, res) => {
  try {
    const { uid } = req.params;
    const { 
      lugarId, 
      lugarNombre, 
      distancia, 
      duracion, 
      coordenadas,
      tipoActividad,
      fecha = new Date().toISOString()
    } = req.body;
    
    console.log('Guardando ruta completada para usuario:', uid, {
      lugarId, 
      lugarNombre, 
      distancia, 
      duracion,
      tipoActividad
    });

    if (!lugarId || !lugarNombre) {
      return res.status(400).json({
        success: false,
        message: 'lugarId y lugarNombre son requeridos'
      });
    }

    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Usar el método del modelo para agregar la ruta
    await user.addRutaCompletada({
      lugarId,
      lugarNombre,
      distancia: distancia || 0,
      duracion: duracion || 0,
      coordenadas: coordenadas || [],
      tipoActividad: tipoActividad || "senderismo",
      fecha
    });

    // Obtener estadísticas actualizadas
    const estadisticas = user.getEstadisticasRutas();

    console.log('Ruta guardada exitosamente. Total de rutas:', user.rutasCompletadas.length);

    res.json({
      success: true,
      message: 'Ruta guardada en tu historial de aventuras',
      totalRutas: user.rutasCompletadas.length,
      estadisticas
    });

  } catch (error) {
    console.error('Error guardando ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar ruta: ' + error.message
    });
  }
});

// OBTENER RUTAS COMPLETADAS (para el mapa de calor)
router.get("/:uid/rutas-completadas", async (req, res) => {
  try {
    const { uid } = req.params;
    const { limit, offset } = req.query;
    
    console.log('Obteniendo rutas completadas para usuario:', uid);
    
    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    let rutasCompletadas = user.rutasCompletadas || [];

    // Ordenar por fecha más reciente primero
    rutasCompletadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Aplicar paginación si se solicita
    if (limit) {
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + parseInt(limit);
      rutasCompletadas = rutasCompletadas.slice(startIndex, endIndex);
    }

    // Obtener estadísticas
    const estadisticas = user.getEstadisticasRutas();

    console.log('Rutas obtenidas:', rutasCompletadas.length);

    res.json({
      success: true,
      rutas: rutasCompletadas,
      estadisticas,
      paginacion: {
        total: user.rutasCompletadas.length,
        mostrando: rutasCompletadas.length,
        offset: parseInt(offset) || 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo rutas completadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutas completadas: ' + error.message
    });
  }
});

// OBTENER ESTADÍSTICAS DE RUTAS (resumen rápido)
router.get("/:uid/estadisticas-rutas", async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('Obteniendo estadísticas de rutas para usuario:', uid);
    
    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const estadisticas = user.getEstadisticasRutas();
    const progresoLogros = user.getAchievementsProgress();

    console.log('Estadísticas obtenidas:', estadisticas);

    res.json({
      success: true,
      estadisticas,
      progresoLogros,
      resumen: {
        usuario: user.displayName || user.nombre || 'Aventurero',
        nivel: calcularNivel(estadisticas.distanciaTotal),
        siguienteNivel: calcularSiguienteNivel(estadisticas.distanciaTotal)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas: ' + error.message
    });
  }
});

// ELIMINAR RUTA COMPLETADA
router.delete("/:uid/rutas-completadas/:rutaId", async (req, res) => {
  try {
    const { uid, rutaId } = req.params;
    
    console.log('Eliminando ruta completada:', rutaId, 'para usuario:', uid);

    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Filtrar la ruta a eliminar
    const rutasInicial = user.rutasCompletadas.length;
    user.rutasCompletadas = user.rutasCompletadas.filter(
      ruta => ruta._id.toString() !== rutaId
    );

    if (user.rutasCompletadas.length === rutasInicial) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
      });
    }

    await user.save();

    console.log('Ruta eliminada. Total restante:', user.rutasCompletadas.length);

    res.json({
      success: true,
      message: 'Ruta eliminada correctamente',
      totalRutas: user.rutasCompletadas.length
    });

  } catch (error) {
    console.error('Error eliminando ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ruta: ' + error.message
    });
  }
});

// FUNCIONES AUXILIARES PARA NIVELES
function calcularNivel(distanciaTotal) {
  const niveles = [
    { km: 0, nombre: "Principiante" },
    { km: 10, nombre: "Explorador Novato" },
    { km: 25, nombre: "Aventurero" },
    { km: 50, nombre: "Experto en Senderismo" },
    { km: 100, nombre: "Maestro de la Montaña" },
    { km: 200, nombre: "Leyenda Viva" }
  ];

  for (let i = niveles.length - 1; i >= 0; i--) {
    if (distanciaTotal >= niveles[i].km) {
      return niveles[i];
    }
  }
  return niveles[0];
}

function calcularSiguienteNivel(distanciaTotal) {
  const niveles = [0, 10, 25, 50, 100, 200, 500];
  for (const km of niveles) {
    if (distanciaTotal < km) {
      return {
        kmRequeridos: km,
        kmFaltantes: km - distanciaTotal,
        nombre: obtenerNombreNivel(km)
      };
    }
  }
  return { kmRequeridos: null, kmFaltantes: 0, nombre: "¡Máximo nivel alcanzado!" };
}

function obtenerNombreNivel(km) {
  const nombres = {
    0: "Principiante",
    10: "Explorador Novato", 
    25: "Aventurero",
    50: "Experto en Senderismo",
    100: "Maestro de la Montaña",
    200: "Leyenda Viva",
    500: "Dios del Ecoturismo"
  };
  return nombres[km] || "Explorador";
}

export default router;