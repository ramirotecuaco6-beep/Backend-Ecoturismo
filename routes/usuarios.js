// routes/usuarios.js
import express from "express";
import { prueba, registrarOActualizar, obtenerPerfil, addAchievement, addSteps } from "../controllers/usuariosController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/prueba", prueba);
router.post("/registrar", verifyFirebaseToken, registrarOActualizar);
router.get("/profile", verifyFirebaseToken, obtenerPerfil);
router.post("/logros", verifyFirebaseToken, addAchievement);
router.post("/steps", verifyFirebaseToken, addSteps);

export default router;
