// models/RoutePoint.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const RoutePointSchema = new Schema({
  uid: String,
  timestamp: Date,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
});
RoutePointSchema.index({ location: "2dsphere" });

export default mongoose.model("RoutePoint", RoutePointSchema);
