// models/UserPhoto.js
import mongoose from "mongoose";

const UserPhotoSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['profile', 'gallery', 'personal'], 
    default: 'gallery' 
  },
  
  // 🔥 NUEVO CAMPO: Tipo de media (foto o video)
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  
  description: { 
    type: String, 
    default: '' 
  },
  location: { 
    type: String, 
    default: 'Libres, Puebla' 
  },
  isPublic: { 
    type: Boolean, 
    default: true  // 🔥 CAMBIADO: Por defecto las fotos/videos son públicas
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  cloudinaryData: {
    // 🔥 ACTUALIZADO: Campos para fotos y videos
    resource_type: String, // 'image' o 'video'
    format: String,        // 'jpg', 'png', 'mp4', 'webm', etc.
    bytes: Number,         // Tamaño en bytes
    width: Number,         // Ancho (para fotos y videos)
    height: Number,        // Alto (para fotos y videos)
    
    // 🔥 NUEVOS CAMPOS ESPECÍFICOS PARA VIDEOS:
    duration: Number,      // Duración en segundos (solo videos)
    video_codec: String,   // Códec de video (h264, h265, etc.)
    audio_codec: String,   // Códec de audio (aac, mp3, etc.)
    bit_rate: Number,      // Tasa de bits (bps)
    frame_rate: Number,    // Frames por segundo
    nb_frames: Number      // Número total de frames
  }
}, {
  timestamps: true
});

// 🔥 NUEVO: Índice compuesto para búsquedas más eficientes
UserPhotoSchema.index({ userId: 1, mediaType: 1 });
UserPhotoSchema.index({ mediaType: 1, isPublic: 1 });
UserPhotoSchema.index({ uploadedAt: -1 });

export default mongoose.model("UserPhoto", UserPhotoSchema);