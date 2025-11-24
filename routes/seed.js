// routes/seed.js
import express from 'express';
import Lugar from '../models/Lugar.js';
import Actividad from '../models/Actividad.js';

const router = express.Router();

// 🟢 Seed de lugares y actividades
router.post('/', async (req, res) => {
  try {
    // 1️⃣ Lugares de ejemplo
    const lugares = [
      {
        nombre: "Grutas de Xonotla",
        descripcion: "Sistema de cuevas milenarias con formaciones calcáreas únicas.",
        imagen_url: "https://picsum.photos/640/480?random=1",
        coordenadas: { lat: 19.4326, lng: -99.1332 },
        precio: "Desde $200",
        rating: 4.9,
        caracteristicas: ["Cuevas naturales", "Guías expertos", "Fotografía"],
      },
      {
        nombre: "Río Libres",
        descripcion: "Un río cristalino ideal para actividades acuáticas y picnic.",
        imagen_url: "https://picsum.photos/640/480?random=2",
        coordenadas: { lat: 19.4500, lng: -99.1200 },
        precio: "Gratis",
        rating: 4.7,
        caracteristicas: ["Kayak", "Pesca", "Zona de picnic"],
      },
    ];

    // 2️⃣ Actividades de ejemplo
    const actividades = [
      {
        titulo: "Senderismo en la Sierra",
        descripcion: "Disfruta de rutas ecológicas entre montañas y ríos.",
        imagen_url: "https://picsum.photos/640/480?random=3",
        precio: "Desde $150",
        lugar: "Grutas de Xonotla",
        caracteristicas: ["Guía incluido", "Equipo recomendado"],
        duracion: "3 horas",
        dificultad: "Media",
      },
      {
        titulo: "Kayak en el río",
        descripcion: "Aventura acuática para principiantes y expertos.",
        imagen_url: "https://picsum.photos/640/480?random=3",
        precio: "Desde $200",
        lugar: "Río Libres",
        caracteristicas: ["Chaleco salvavidas", "Instructor"],
        duracion: "2 horas",
        dificultad: "Fácil",
      },
      {
        titulo: "Fotografía en las Grutas",
        descripcion: "Captura las mejores formaciones de las grutas con guías expertos.",
    imagen_url: "https://picsum.photos/640/480?random=3",
        precio: "Desde $100",
        lugar: "Grutas de Xonotla",
        caracteristicas: ["Equipo recomendado", "Guía fotográfico"],
        duracion: "2 horas",
        dificultad: "Fácil",
      },
    ];

    // Limpiar la DB antes de insertar
    await Lugar.deleteMany();
    await Actividad.deleteMany();

    // Insertar
    const lugaresInsertados = await Lugar.insertMany(lugares);
    const actividadesInsertadas = await Actividad.insertMany(actividades);

    res.json({ lugares: lugaresInsertados, actividades: actividadesInsertadas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al insertar seed data', error: error.message });
  }
});

export default router;
