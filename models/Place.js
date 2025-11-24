
// models/Place.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const PlaceSchema = new Schema({
  nombre: String,
  description: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] } // [lng, lat]
  },
  tags: [String]
});
PlaceSchema.index({ location: "2dsphere" });

export default mongoose.model("Place", PlaceSchema);
