import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
});

const RideSchema = new mongoose.Schema({
  origin: { lat: Number, lng: Number, area: String },
  destination: { lat: Number, lng: Number, area: String },
  startLocation: String,
  destinationName: String,
  seats: Number,
  price: Number,
  when: Date,
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driver_name: String,
  femaleRidersOnly: Boolean,
  maleRidersOnly: Boolean,
  requests: [RequestSchema], // ✅ REQUIRED
});

export default mongoose.model("Ride", RideSchema);

