import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  matchScore: Number,
  price: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Match", matchSchema);
