import mongoose from 'mongoose';

const lugarSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es requerido'] 
  },
  descripcion: { 
    type: String, 
    required: [true, 'La descripción es requerida'] 
  },
  imagen_url: { 
    type: String, 
    required: [true, 'La imagen es requerida'] 
  },
  coordenadas: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  direccion: String,
  precio: String,
  rating: { type: Number, default: 4.5 },
  caracteristicas: [String],
  activo: { type: Boolean, default: true },
  creadoEn: { type: Date, default: Date.now }
});

export default mongoose.model('Lugar', lugarSchema);