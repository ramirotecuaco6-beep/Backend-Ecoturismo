// routes/rutas.js
import express from "express";
import { guardarRuta, obtenerRutasPorDia } from "../controllers/rutasController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, guardarRuta);
router.get("/", verifyFirebaseToken, obtenerRutasPorDia);

export default router;
