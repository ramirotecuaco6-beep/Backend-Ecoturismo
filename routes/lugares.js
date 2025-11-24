// routes/lugares.js
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Lugar from '../models/Lugar.js';
import Actividad from '../models/Actividad.js';

const router = express.Router();

// 🔧 CONFIGURACIÓN MULTER PARA SUBIR IMÁGENES
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// 🟢 GET - Todos los lugares activos
router.get('/', async (req, res) => {
  try {
    const lugares = await Lugar.find({ activo: true }).sort({ creadoEn: -1 });
    res.json(lugares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 GET - Lugar específico por NOMBRE con actividades
router.get('/:nombreLugar', async (req, res) => {
  try {
    const { nombreLugar } = req.params;
    
    const lugar = await Lugar.findOne({ 
      nombre: { $regex: new RegExp('^' + nombreLugar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
      activo: true
    });

    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    const actividades = await Actividad.find({
      lugar: lugar.nombre,
      activo: true
    }).sort({ creadoEn: -1 });

    res.json({ lugar, actividades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 GET - Lugar específico por ID con actividades
router.get('/id/:id', async (req, res) => {
  try {
    const lugar = await Lugar.findById(req.params.id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    const actividades = await Actividad.find({
      lugar: lugar.nombre,
      activo: true
    }).sort({ creadoEn: -1 });

    res.json({ lugar, actividades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟡 POST - Crear lugar (ACEPTA JSON Y FORM-DATA)
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    console.log('📥 Datos recibidos:', {
      body: req.body,
      file: req.file ? `Archivo: ${req.file.originalname}` : 'No hay archivo'
    });

    let imagen_url = req.body.imagen_url;
    let coordenadas = req.body.coordenadas;

    // 🔄 PROCESAR IMAGEN SI SE SUBIÓ ARCHIVO
    if (req.file) {
      console.log('📸 Subiendo imagen a Cloudinary...');
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'lugares_ecolibres',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error, result) => {
            if (error) {
              console.error('❌ Error Cloudinary:', error);
              reject(error);
            } else {
              console.log('✅ Imagen subida a Cloudinary:', result.secure_url);
              resolve(result);
            }
          }
        );
        uploadStream.end(req.file.buffer);
      });

      imagen_url = result.secure_url;
    }

    // 🔄 PROCESAR COORDENADAS (pueden venir como string o objeto)
    if (typeof coordenadas === 'string') {
      try {
        coordenadas = JSON.parse(coordenadas);
      } catch (parseError) {
        console.log('⚠️ Coordenadas no son JSON, intentando parsear individualmente...');
        // Si vienen como campos separados en form-data
        coordenadas = {
          lat: parseFloat(req.body.lat) || parseFloat(req.body['coordenadas[lat]']),
          lng: parseFloat(req.body.lng) || parseFloat(req.body['coordenadas[lng]'])
        };
      }
    }

    // Si las coordenadas vienen como campos individuales en form-data
    if (!coordenadas || !coordenadas.lat || !coordenadas.lng) {
      coordenadas = {
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng)
      };
    }

    // 🛑 VALIDAR CAMPOS REQUERIDOS
    if (!req.body.nombre) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }
    if (!req.body.descripcion) {
      return res.status(400).json({ error: "La descripción es requerida" });
    }
    if (!imagen_url) {
      return res.status(400).json({ error: "La imagen es requerida (URL o archivo)" });
    }
    if (!coordenadas || !coordenadas.lat || !coordenadas.lng) {
      return res.status(400).json({ 
        error: "Las coordenadas son requeridas",
        detalles: {
          lat: coordenadas?.lat ? "OK" : "Falta latitud",
          lng: coordenadas?.lng ? "OK" : "Falta longitud"
        }
      });
    }

    // 🏗️ CONSTRUIR OBJETO DEL LUGAR
    const lugarData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      imagen_url: imagen_url,
      coordenadas: {
        lat: coordenadas.lat,
        lng: coordenadas.lng
      },
      direccion: req.body.direccion,
      precio: req.body.precio,
      rating: req.body.rating ? parseFloat(req.body.rating) : 4.5,
      caracteristicas: req.body.caracteristicas ? 
        (typeof req.body.caracteristicas === 'string' ? 
          JSON.parse(req.body.caracteristicas) : 
          req.body.caracteristicas) : [],
      activo: req.body.activo !== 'false'
    };

    console.log('💾 Guardando lugar en base de datos:', lugarData);

    const nuevoLugar = new Lugar(lugarData);
    const lugarGuardado = await nuevoLugar.save();

    console.log('✅ Lugar creado exitosamente:', lugarGuardado._id);

    res.status(201).json({
      success: true,
      message: "Lugar creado exitosamente",
      lugar: lugarGuardado
    });

  } catch (error) {
    console.error('❌ Error al crear lugar:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 🟠 PUT - Actualizar lugar
router.put('/:id', async (req, res) => {
  try {
    const lugarActualizado = await Lugar.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(lugarActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔴 DELETE - Eliminar lugar
router.delete('/:id', async (req, res) => {
  try {
    await Lugar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lugar eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;