// tempRoutes.js
import express from "express";

const router = express.Router();

console.log('🔥 tempRoutes.js CARGADO - ESTO DEBE APARECER EN CONSOLA');

// 🔹 RUTA DE PRUEBA SUPER SIMPLE
router.get("/temp-test", (req, res) => {
  console.log('🎯 GET /api/temp/temp-test FUNCIONANDO');
  res.json({ 
    message: "✅ RUTA TEMPORAL FUNCIONA PERFECTAMENTE",
    proof: "Si ves esto, el problema está en userRoutes.js",
    timestamp: new Date(),
    working: true
  });
});

// 🔹 RUTA PARA SUBIR FOTOS SIMPLE
router.post("/temp-upload", (req, res) => {
  console.log('🎯 POST /api/temp/temp-upload FUNCIONANDO');
  res.json({ 
    message: "✅ UPLOAD TEMPORAL FUNCIONA",
    received: true,
    timestamp: new Date(),
    working: true
  });
});

// 🔹 RUTA PARA VER FOTOS SIMPLE
router.get("/temp-photos", (req, res) => {
  console.log('🎯 GET /api/temp/temp-photos FUNCIONANDO');
  res.json({ 
    ok: true, 
    photos: [],
    message: "Galería temporal funcionando",
    timestamp: new Date()
  });
});

console.log('✅ tempRoutes.js - RUTAS REGISTRADAS:', [
  'GET /api/temp/temp-test',
  'POST /api/temp/temp-upload',
  'GET /api/temp/temp-photos'
]);

export default router;