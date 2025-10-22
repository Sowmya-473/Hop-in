// backend/routes/rideRoutes.js
import express from "express";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    console.log("📥 Incoming ride data:", req.body);

    const {
      origin,
      destination,
      startLocation,
      destinationName,
      seats,
      price,
      date,
      time,
      femaleRidersOnly,
      maleRidersOnly,
    } = req.body;

    if (!origin || !destination || !price) {
      return res.status(400).json({ error: "Origin, destination, and price are required." });
    }

    const driver = await User.findById(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const when = date && time ? new Date(`${date}T${time}:00Z`) : new Date();

    const ride = await Ride.create({
      origin,
      destination,
      startLocation,
      destinationName,
      seats: seats || 4,
      price, // ✅ exact suggested price only
      when,
      driver_id: driver._id,
      driver_name: driver.name,
      femaleRidersOnly: !!femaleRidersOnly,
      maleRidersOnly: !!maleRidersOnly,
    });

    console.log("✅ Ride created:", ride);
    res.status(201).json({ message: "Ride created successfully", ride });
  } catch (err) {
    console.error("❌ Ride creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all available rides (excluding the current user's own rides)
router.get("/", auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      driver_id: { $ne: req.user.id }, // exclude current user's rides
      when: { $gte: new Date() },      // only upcoming rides
    }).sort({ when: 1 });

    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Fetch rides error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Get nearby rides (excluding user's own)
router.post("/search", auth, async (req, res) => {
  try {
    const { origin, destination, userId } = req.body;

    // Convert approximate degree difference for 5 km radius (~0.045°)
    const radius = 0.045;

    // Find rides that:
    // - start near origin
    // - end near destination
    // - are in future
    // - are not published by the current user
    const rides = await Ride.find({
      "origin.lat": { $gte: origin.lat - radius, $lte: origin.lat + radius },
      "origin.lng": { $gte: origin.lng - radius, $lte: origin.lng + radius },
      "destination.lat": { $gte: destination.lat - radius, $lte: destination.lat + radius },
      "destination.lng": { $gte: destination.lng - radius, $lte: destination.lng + radius },
      driver_id: { $ne: userId }, // exclude current user's rides
      when: { $gte: new Date() }, // future rides only
    }).sort({ when: 1 });

    console.log(`✅ Found ${rides.length} matching rides`);
    res.json(rides);
  } catch (err) {
    console.error("❌ Error fetching rides:", err);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// ✅ Get active rides of the logged-in driver
router.get("/my", auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      driver_id: req.user.id,
      when: { $gte: new Date() },
    }).populate("bookings.user", "name phone email");

    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Fetch my rides error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a ride (driver only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Ensure the logged-in driver owns the ride
    if (ride.driver_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this ride" });
    }

    await ride.deleteOne();
    res.json({ message: "Ride deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting ride:", err);
    res.status(500).json({ error: "Server error while deleting ride" });
  }
});

// ✅ Mark a ride as ended (driver only)
router.post("/:id/end", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Only the driver who created the ride can end it
    if (ride.driver_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to end this ride" });
    }

    // Update status (you can add a 'status' field in your Ride schema if not present)
    ride.status = "ended";
    await ride.save();

    res.json({ message: "Ride ended successfully", ride });
  } catch (err) {
    console.error("❌ Error ending ride:", err);
    res.status(500).json({ error: "Server error while ending ride" });
  }
});


export default router;
