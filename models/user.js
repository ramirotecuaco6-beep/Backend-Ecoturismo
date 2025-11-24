import mongoose from "mongoose";
const { Schema } = mongoose;

// 🏆 Esquema MEJORADO de logros
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

// 👤 Usuario principal - VERSIÓN CORREGIDA
const UserSchema = new Schema({
  // 🔥 CAMPO PRINCIPAL - Usar _id como UID de Firebase
  _id: { 
    type: String, 
    required: true
  },
  
  // 📧 Email - QUITAR unique temporalmente para resolver conflictos
  email: { 
    type: String, 
    required: true
    // 🔥 QUITADO: unique: true temporalmente
  },
  
  // Nombres para compatibilidad
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

// Índices para consultas rápidas (sin índice único en email temporalmente)
UserSchema.index({ email: 1 }); // 🔥 QUITADO: unique: true
UserSchema.index({ 'logros.id': 1 });
UserSchema.index({ 'logros.completado': 1 });

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
        stepsByDay: userData.stepsByDay || []
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

export default mongoose.model("User", UserSchema);