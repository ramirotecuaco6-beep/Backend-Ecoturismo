// controllers/rutasController.js
import Route from "../models/Route.js";
import RoutePoint from "../models/RoutePoint.js";

export const guardarRuta = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { startAt, endAt, points, steps, distanceMeters } = req.body;
    if (!points || points.length < 2) return res.status(400).json({ error: "Se requieren puntos" });

    const dayKey = new Date(startAt || Date.now()).toISOString().slice(0, 10);

    // Guardar LineString en Route
    const route = await Route.create({
      uid,
      startAt,
      endAt,
      points: { type: "LineString", coordinates: points },
      steps,
      distanceMeters,
      dayKey
    });

    // Opcional: guardar puntos individuales para heatmap
    const pointDocs = points.map((coord, i) => ({
      uid,
      timestamp: new Date(startAt ? new Date(startAt).getTime() + i * 1000 : Date.now()),
      location: { type: "Point", coordinates: coord }
    }));
    await RoutePoint.insertMany(pointDocs);

    res.json({ ok: true, route });
  } catch (err) {
    console.error("Error guardarRuta:", err);
    res.status(500).json({ error: "Error guardando ruta" });
  }
};

export const obtenerRutasPorDia = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { day } = req.query; // YYYY-MM-DD
    if (!day) return res.status(400).json({ error: "Falta day query param" });

    const routes = await Route.find({ uid, dayKey: day }).lean();
    res.json({ ok: true, routes });
  } catch (err) {
    console.error("Error obtenerRutasPorDia:", err);
    res.status(500).json({ error: "Error obteniendo rutas" });
  }
};
