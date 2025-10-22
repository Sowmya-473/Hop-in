// backend/models/Ride.js
import mongoose from "mongoose";

const RideSchema = new mongoose.Schema(
  {
    origin: {
      lat: Number,
      lng: Number,
      area: String,
    },
    destination: {
      lat: Number,
      lng: Number,
      area: String,
    },

    // 🆕 Readable address fields for UI display
    startLocation: { type: String, required: true },
    destinationName: { type: String, required: true },

    seats: { type: Number, required: true },
    price: { type: Number, required: true },
    when: { type: Date, required: true },

    // ✅ Driver info
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver_name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    },
    // 🧍‍♀️ Booking info
    bookings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Ride", RideSchema);
