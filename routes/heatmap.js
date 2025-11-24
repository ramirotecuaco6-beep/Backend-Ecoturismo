// routes/heatmap.js
import express from "express";
import { heatmap } from "../controllers/heatmapController.js";

const router = express.Router();

router.get("/", heatmap);

export default router;
