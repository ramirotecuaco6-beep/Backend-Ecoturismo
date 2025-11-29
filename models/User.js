import mongoose from "mongoose";
const { Schema } = mongoose;

// 🎯 Esquema MEJORADO de logros
const AchievementSchema = new Schema(
  {
    id: { 
      type: String, 
      required: true 
    },
    nombre: { 
      type: String, 
      required: true 
    },
    descripcion: String,
    icono: String,
    fechaObtencion: { 
      type: Date, 
      default: Date.now 
    },
    progreso: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100 
    },
    meta: { 
      type: Number, 
      default: 100 
    },
    completado: { 
      type: Boolean, 
      default: false 
    },
    categoria: String,
    fecha_desbloqueo: { type: Date, default: Date.now }
  },
  { _id: false }
);

// 🦶 Esquema de pasos diarios
const StepSchema = new Schema(
  {
    date: { type: Date, required: true },
    steps: { type: Number, default: 0 },
  },
  { _id: false }
);

// 📍 Lugares visitados
const VisitedPlaceSchema = new Schema(
  {
    placeId: { type: Schema.Types.ObjectId, ref: "Place" },
    visitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 🗺️ ESQUEMA NUEVO: Rutas completadas (para el mapa de calor)
const RutaCompletadaSchema = new Schema(
  {
    lugarId: { 
      type: String, 
      required: true 
    },
    lugarNombre: { 
      type: String, 
      required: true 
    },
    distancia: { 
      type: Number, 
      default: 0 
    }, // en km
    duracion: { 
      type: Number, 
      default: 0 
    }, // en minutos
    coordenadas: [{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    fecha: { 
      type: Date, 
      default: Date.now 
    },
    completada: { 
      type: Boolean, 
      default: true 
    },
    tipoActividad: {
      type: String,
      enum: ["senderismo", "natacion", "camping", "escalada", "observacion", "fotografia", "otros"],
      default: "senderismo"
    }
  },
  { _id: true } // IMPORTANTE: mantener _id para poder referenciar
);

// 👤 Usuario principal - VERSIÓN MEJORADA CON RUTAS COMPLETADAS
const UserSchema = new Schema({
  // 🔥 CAMPO PRINCIPAL - Usar _id como UID de Firebase
  _id: { 
    type: String, 
    required: true
  },
  
  // 📧 Email
  email: { 
    type: String, 
    required: true
  },
  
  // 👤 Nombres para compatibilidad
  nombre: { type: String },
  displayName: { type: String },
  
  // 🖼️ Fotos de perfil
  profilePhoto: { type: String, default: "" },
  avatar: { type: String },
  photoURL: { type: String },
  
  // 📅 Fechas
  fechaRegistro: { type: Date, default: Date.now },
  ultimaConexion: { type: Date, default: Date.now },
  
  // 🎯 Datos de la aplicación
  logros: [AchievementSchema],
  visitedPlaces: [VisitedPlaceSchema],
  stepsByDay: [StepSchema],
  
  // 🗺️ CAMPO NUEVO: Historial de rutas completadas (PARA EL MAPA DE CALOR)
  rutasCompletadas: [RutaCompletadaSchema],
  
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.uid = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para consultas rápidas
UserSchema.index({ email: 1 });
UserSchema.index({ 'logros.id': 1 });
UserSchema.index({ 'logros.completado': 1 });
UserSchema.index({ 'rutasCompletadas.fecha': -1 }); // Índice nuevo para ordenar por fecha

// ✅ Método CORREGIDO para encontrar o crear usuario
UserSchema.statics.findOrCreate = async function(userData) {
  try {
    if (!userData.uid && !userData._id) {
      throw new Error('UID es requerido para findOrCreate');
    }

    const uid = userData.uid || userData._id;
    console.log('🔍 Buscando usuario con UID:', uid);
    
    // Buscar por UID (_id) primero
    let user = await this.findById(uid);
    
    if (user) {
      console.log('✅ Usuario encontrado por UID, actualizando datos');
      // Actualizar datos del usuario existente
      user.email = userData.email || user.email;
      user.displayName = userData.name || userData.displayName || user.displayName;
      user.nombre = userData.name || userData.displayName || user.nombre;
      user.profilePhoto = userData.picture || userData.photoURL || user.profilePhoto;
      user.avatar = userData.picture || userData.photoURL || user.avatar;
      user.photoURL = userData.picture || userData.photoURL || user.photoURL;
      user.ultimaConexion = new Date();
    } else {
      console.log('🆕 Creando nuevo usuario con UID:', uid);
      // Crear nuevo usuario
      user = new this({
        _id: uid,
        email: userData.email,
        displayName: userData.name || userData.displayName || '',
        nombre: userData.name || userData.displayName || '',
        profilePhoto: userData.picture || userData.photoURL || '',
        avatar: userData.picture || userData.photoURL || '',
        photoURL: userData.picture || userData.photoURL || '',
        logros: userData.logros || [],
        visitedPlaces: userData.visitedPlaces || [],
        stepsByDay: userData.stepsByDay || [],
        rutasCompletadas: userData.rutasCompletadas || [] // ✅ NUEVO CAMPO INICIALIZADO
      });
    }
    
    await user.save();
    console.log('💾 Usuario guardado exitosamente');
    return user;
    
  } catch (error) {
    console.error('❌ Error en findOrCreate:', error);
    throw error;
  }
};

// ✅ MÉTODO: Agregar o actualizar logro
UserSchema.methods.addAchievement = function(achievementData) {
  try {
    if (!achievementData.id) {
      throw new Error('ID del logro es requerido');
    }

    const existingIndex = this.logros.findIndex(logro => logro.id === achievementData.id);
    
    if (existingIndex !== -1) {
      // Actualizar logro existente
      this.logros[existingIndex] = {
        ...this.logros[existingIndex].toObject(),
        ...achievementData
      };
      
      if (achievementData.progreso !== undefined && achievementData.meta !== undefined) {
        this.logros[existingIndex].completado = achievementData.progreso >= achievementData.meta;
      }
      
      console.log('✅ Logro actualizado:', achievementData.id);
    } else {
      // Agregar nuevo logro
      const newAchievement = {
        ...achievementData,
        fechaObtencion: new Date(),
        fecha_desbloqueo: new Date(),
        completado: achievementData.progreso >= achievementData.meta
      };
      
      this.logros.push(newAchievement);
      console.log('✅ Nuevo logro agregado:', achievementData.id);
    }
    
    return this.save();
  } catch (error) {
    console.error('❌ Error en addAchievement:', error);
    throw error;
  }
};

// 🗺️ MÉTODO NUEVO: Agregar ruta completada
UserSchema.methods.addRutaCompletada = function(rutaData) {
  try {
    console.log('🗺️ Agregando ruta completada para usuario:', this._id);
    
    if (!rutaData.lugarId || !rutaData.lugarNombre) {
      throw new Error('lugarId y lugarNombre son requeridos');
    }

    const nuevaRuta = {
      lugarId: rutaData.lugarId,
      lugarNombre: rutaData.lugarNombre,
      distancia: rutaData.distancia || 0,
      duracion: rutaData.duracion || 0,
      coordenadas: rutaData.coordenadas || [],
      fecha: rutaData.fecha ? new Date(rutaData.fecha) : new Date(),
      completada: true,
      tipoActividad: rutaData.tipoActividad || "senderismo"
    };

    // Inicializar array si no existe
    if (!this.rutasCompletadas) {
      this.rutasCompletadas = [];
    }

    this.rutasCompletadas.push(nuevaRuta);
    console.log('✅ Ruta agregada. Total de rutas:', this.rutasCompletadas.length);
    
    return this.save();
  } catch (error) {
    console.error('❌ Error en addRutaCompletada:', error);
    throw error;
  }
};

// 📊 MÉTODO NUEVO: Obtener estadísticas de rutas
UserSchema.methods.getEstadisticasRutas = function() {
  const rutas = this.rutasCompletadas || [];
  
  return {
    totalRutas: rutas.length,
    lugaresUnicos: new Set(rutas.map(r => r.lugarId)).size,
    distanciaTotal: rutas.reduce((total, ruta) => total + (ruta.distancia || 0), 0),
    tiempoTotal: rutas.reduce((total, ruta) => total + (ruta.duracion || 0), 0),
    actividadMasComun: this.getActividadMasComun(),
    ultimaRuta: rutas.length > 0 ? rutas[rutas.length - 1] : null
  };
};

// 🏆 MÉTODO NUEVO: Obtener actividad más común
UserSchema.methods.getActividadMasComun = function() {
  const rutas = this.rutasCompletadas || [];
  if (rutas.length === 0) return "senderismo";
  
  const conteo = {};
  rutas.forEach(ruta => {
    const actividad = ruta.tipoActividad || "senderismo";
    conteo[actividad] = (conteo[actividad] || 0) + 1;
  });
  
  return Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
};

// ✅ MÉTODO: Obtener logros completados
UserSchema.methods.getCompletedAchievements = function() {
  return this.logros.filter(logro => logro.completado);
};

// ✅ MÉTODO: Obtener progreso total de logros
UserSchema.methods.getAchievementsProgress = function() {
  const total = this.logros.length;
  const completed = this.getCompletedAchievements().length;
  
  return {
    total,
    completed,
    progress: total > 0 ? (completed / total) * 100 : 0
  };
};

export default mongoose.model("user", UserSchema);