import mongoose from 'mongoose';

const actividadSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: [true, 'El título es requerido'] 
  },
  descripcion: { 
    type: String, 
    required: [true, 'La descripción es requerida'] 
  },
  imagen_url: { 
    type: String, 
    required: [true, 'La imagen es requerida'] 
  },
  precio: String,
  lugar: String,
  caracteristicas: [String],
  duracion: String,
  dificultad: { type: String, default: 'Media' },
  activo: { type: Boolean, default: true },
  creadoEn: { type: Date, default: Date.now }
});

export default mongoose.model('Actividad', actividadSchema);