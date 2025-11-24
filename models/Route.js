// models/Route.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const RouteSchema = new Schema({
  uid: { type: String, required: true }, // Firebase uid
  startAt: Date,
  endAt: Date,
  // GeoJSON LineString
  points: {
    type: { type: String, enum: ["LineString"], default: "LineString" },
    coordinates: { type: [[Number]], required: true } // [[lng, lat], ...]
  },
  steps: Number,
  distanceMeters: Number,
  dayKey: String // 'YYYY-MM-DD'
});

RouteSchema.index({ points: "2dsphere" });

export default mongoose.model("Route", RouteSchema);
