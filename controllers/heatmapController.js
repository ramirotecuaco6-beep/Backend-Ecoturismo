// controllers/heatmapController.js
import RoutePoint from "../models/RoutePoint.js";

/**
 * Agrega puntos a cuadrícula simple y devuelve celdas con conteo.
 * Query params: from=YYYY-MM-DD, to=YYYY-MM-DD, precision=1000 (multipl. para bucket)
 */
export const heatmap = async (req, res) => {
  try {
    const { from, to, precision } = req.query;
    const prec = Number(precision) || 1000; // multiplica lat/lng antes de floor
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();

    // pipeline simple (similar a la idea en la conversación previa)
    const pipeline = [
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      {
        $project: {
          lng: { $arrayElemAt: ["$location.coordinates", 0] },
          lat: { $arrayElemAt: ["$location.coordinates", 1] }
        }
      },
      {
        $project: {
          bucketX: { $floor: { $multiply: ["$lng", prec] } },
          bucketY: { $floor: { $multiply: ["$lat", prec] } }
        }
      },
      {
        $group: {
          _id: { x: "$bucketX", y: "$bucketY" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          center: [
            { $divide: [{ $add: ["$_id.x", 0.5] }, prec] },
            { $divide: [{ $add: ["$_id.y", 0.5] }, prec] }
          ],
          count: 1
        }
      },
      { $limit: 10000 }
    ];

    const result = await RoutePoint.aggregate(pipeline);
    res.json({ ok: true, cells: result });
  } catch (err) {
    console.error("Error heatmap:", err);
    res.status(500).json({ error: "Error generando heatmap" });
  }
};
