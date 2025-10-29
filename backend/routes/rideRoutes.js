// backend/routes/rideRoutes.js
import express from "express";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ Create a new ride
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
      price,
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

// ✅ Get all available rides (excluding current user's rides)
router.get("/", auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      driver_id: { $ne: req.user.id },
      when: { $gte: new Date() },
    }).sort({ when: 1 });

    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Fetch rides error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Search nearby rides
router.post("/search", auth, async (req, res) => {
  try {
    const { origin, destination, userId } = req.body;
    const radius = 0.045; // ~5 km

    const rides = await Ride.find({
      "origin.lat": { $gte: origin.lat - radius, $lte: origin.lat + radius },
      "origin.lng": { $gte: origin.lng - radius, $lte: origin.lng + radius },
      "destination.lat": { $gte: destination.lat - radius, $lte: destination.lat + radius },
      "destination.lng": { $gte: destination.lng - radius, $lte: destination.lng + radius },
      driver_id: { $ne: userId },
      when: { $gte: new Date() },
    }).sort({ when: 1 });

    console.log(`✅ Found ${rides.length} matching rides`);
    res.json(rides);
  } catch (err) {
    console.error("❌ Error fetching rides:", err);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// ✅ Get all rides of the logged-in driver
// ✅ Get all rides created by the logged-in driver
router.get("/my", auth, async (req, res) => {
  try {
    const rides = await Ride.find({ driver_id: req.user.id })
      .populate("requests.user", "name email"); // ✅ Correct field

    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Error fetching my rides:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get ride details by ID (for DriverDetailsModal)
// ✅ Get a specific ride by ID (for DriverDetailsModal)
router.get("/:id", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    let driver = null;

    // only fetch driver if ride.driver_id exists
    if (ride.driver_id) {
      try {
        driver = await User.findById(ride.driver_id).select("name email phone");
      } catch (e) {
        console.warn("⚠️ Invalid driver_id format:", ride.driver_id);
      }
    }

    res.status(200).json({
      ...ride.toObject(),
      driver,
    });
  } catch (err) {
    console.error("❌ Error fetching ride details:", err);
    res.status(500).json({ error: err.message });
  }
});



// ✅ Delete a ride
router.delete("/:id", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

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

// ✅ Send a ride request (Passenger → Driver)
router.post("/:id/request", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Ensure the user isn't the driver
    if (ride.driver_id && ride.driver_id.toString() === req.user.id) {
      return res.status(400).json({ error: "You cannot request your own ride" });
    }

    // ✅ Initialize requests array if it doesn’t exist
    if (!Array.isArray(ride.requests)) {
      ride.requests = [];
    }

    // Check if user already requested
    const existing = ride.requests.find(
      (r) => r.user && r.user.toString() === req.user.id
    );
    if (existing) {
      return res.status(400).json({ error: "You already requested this ride" });
    }

    // ✅ Add new request entry
    const newRequest = {
      user: req.user.id,
      status: "pending",
      requestedAt: new Date(),
    };
    ride.requests.push(newRequest);

    // ✅ Save safely
    await ride.save();

    console.log("✅ Ride request created:", newRequest);

    res.status(200).json({
      message: "Ride request sent successfully",
      ride,
    });
  } catch (err) {
    console.error("❌ Ride request error:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});


// ✅ End a ride
router.post("/:id/end", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.driver_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to end this ride" });
    }

    ride.status = "ended";
    await ride.save();
    res.json({ message: "Ride ended successfully", ride });
  } catch (err) {
    console.error("❌ Error ending ride:", err);
    res.status(500).json({ error: "Server error while ending ride" });
  }
});

// ✅ Respond to a ride request (accept or reject)
// ✅ Driver responds to ride requests (accept/reject)
router.post("/:id/respond", auth, async (req, res) => {
  try {
    const { requestId, action } = req.body; // action = "accepted" or "rejected"

    if (!requestId || !action) {
      return res.status(400).json({ error: "Missing requestId or action" });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Only the driver who created the ride can respond
    if (ride.driver_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to respond to this ride" });
    }

    // ✅ Find the request in the ride's requests array
    const request = ride.requests.id(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // ✅ Update request status
    request.status = action;
    await ride.save();

    console.log(`✅ Ride request ${action} by driver for ${requestId}`);

    res.status(200).json({
      message: `Request ${action} successfully`,
      ride,
    });
  } catch (err) {
    console.error("❌ Respond error:", err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
