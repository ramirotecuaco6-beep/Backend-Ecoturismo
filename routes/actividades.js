// routes/actividades.js
import express from 'express';
import Actividad from '../models/Actividad.js';

const router = express.Router();

// 🟢 GET - Todas las actividades activas
router.get('/', async (req, res) => {
  try {
    const actividades = await Actividad.find({ activo: true }).sort({ creadoEn: -1 });
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 GET - Actividad por ID
router.get('/:id', async (req, res) => {
  try {
    const actividad = await Actividad.findById(req.params.id);
    if (!actividad) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    res.json(actividad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 GET - Actividades por lugar
router.get('/por-lugar/:nombreLugar', async (req, res) => {
  try {
    const nombreLugar = decodeURIComponent(req.params.nombreLugar);
    const actividades = await Actividad.find({
      lugar: nombreLugar,
      activo: true
    }).sort({ creadoEn: -1 });

    if (!actividades.length) {
      return res.status(404).json({ message: `No hay actividades en ${nombreLugar}` });
    }

    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 GET - Actividad por nombre (para compatibilidad)
router.get('/nombre/:nombreActividad', async (req, res) => {
  try {
    const nombreActividad = decodeURIComponent(req.params.nombreActividad);
    const actividad = await Actividad.findOne({
      nombre: { $regex: new RegExp('^' + nombreActividad + '$', 'i') },
      activo: true
    });

    if (!actividad) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }

    res.json(actividad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟠 POST - Crear actividad (solo admin)
router.post('/', async (req, res) => {
  try {
    const nuevaActividad = new Actividad(req.body);
    const actividadGuardada = await nuevaActividad.save();
    res.status(201).json(actividadGuardada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🟠 PUT - Actualizar actividad
router.put('/:id', async (req, res) => {
  try {
    const actividadActualizada = await Actividad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(actividadActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔴 DELETE - Eliminar actividad
router.delete('/:id', async (req, res) => {
  try {
    await Actividad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Actividad eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;