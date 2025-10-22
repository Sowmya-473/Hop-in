// server.js
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { spawn } from "child_process";

// Node 18+ has global fetch; if you’re on older Node, uncomment next line
// import fetch from "node-fetch";

dotenv.config();
const PORT = process.env.PORT || 5004;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// ─── Models ───────────────────────────────
import User from "./models/User.js";
import Ride from "./models/Ride.js";
import auth from "./middleware/auth.js";
import rideRoutes from "./routes/rideRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// ─── App Setup ─────────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(bodyParser.json());
app.use("/api/rides", rideRoutes);
app.use("/api/users", userRoutes);


// ─── MongoDB ──────────────────────────────
mongoose
  .connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/carpool", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));



// ─── Helpers ─────────────────────────────
function haversineDistance(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x || 0));
}

function pointLineDistance(A, B, C) {
  const d12 = haversineDistance(A, B);
  if (d12 === 0) return haversineDistance(A, C);
  const d13 = haversineDistance(A, C);
  const d23 = haversineDistance(B, C);
  const s = (d12 + d13 + d23) / 2;
  const area = Math.sqrt(Math.max(s * (s - d12) * (s - d13) * (s - d23), 0));
  return (2 * area) / d12;
}

function heuristicPrice({ base = 100, distance_km = 5, demand = 1 }) {
  return Math.round(base + distance_km * 6 + base * 0.15 * demand);
}

function runPython(script, payload) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", [script, JSON.stringify(payload)], {
      cwd: process.cwd(),
    });
    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || "Python exited with error"));
      try {
        resolve(JSON.parse(stdout.trim().split("\n").pop() || "{}"));
      } catch {
        reject(new Error("Failed to parse Python output"));
      }
    });
  });
}

// in server.js
// ✅ Get current user profile
app.get("/api/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auth Routes ─────────────────────────
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password, role required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    res.json({
      message: "✅ User created",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Geocode & Routing ───────────────────
app.get("/api/geocode", async (req, res) => {
  try {
    const q = String(req.query.query || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    const apiKey = process.env.GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      q
    )}&key=${apiKey}`;

    const r = await fetch(url);
    const data = await r.json();
    if (!data.results.length) return res.status(404).json({ error: "Location not found" });

    const loc = data.results[0].geometry.location;
    res.json({ lat: loc.lat, lng: loc.lng, name: data.results[0].formatted_address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/route", async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (![originLat, originLng, destLat, destLng].every(Boolean)) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const url = `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.routes?.length) return res.status(404).json({ error: "Route not found" });

    const route = data.routes[0];
    res.json({
      distance_km: Number((route.distance / 1000).toFixed(2)),
      duration_min: Math.round(route.duration / 60),
      geometry: route.geometry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rides ───────────────────────────────
// (A) CREATE — supports both {when} OR {date,time} and maps area fields
app.post("/api/rides/add", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Accept both shapes from the frontend
    const {
      origin,
      destination,
      startLocation,       // string (area)
      destinationName,     // string (area)
      seats = 1,
      price,               // optional: if you send it, we’ll respect it; else we compute
      when,                // ISO string optional
      date,                // "YYYY-MM-DD"
      time,                // "HH:mm"
    } = req.body || {};

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({ error: "origin/destination with {lat,lng} required" });
    }

    // Build Date from date+time if when not provided
    const rideWhen =
      when
        ? new Date(when)
        : (date && time)
        ? new Date(`${date}T${time}`)
        : new Date();

    const distance_km = Math.max(0.5, haversineDistance(origin, destination));
    const duration_min = Math.round((distance_km / 28) * 60);

    // Respect incoming price if provided, else compute via ML -> heuristic fallback
    let finalPrice = Number.isFinite(price) ? Number(price) : undefined;
    if (!Number.isFinite(finalPrice)) {
      try {
        const ml = await runPython("pricing.py", {
          distance_km,
          duration_min,
          seats,
          when: rideWhen.toISOString(),
        });
        finalPrice = Math.round(ml.price);
      } catch {
        finalPrice = heuristicPrice({ base: 100, distance_km, demand: 1 });
      }
    }

    // Map to schema shape (add area strings if provided)
    const rideDoc = await Ride.create({
      origin: {
        lat: origin.lat,
        lng: origin.lng,
        area: startLocation || "",     // schema expects area
      },
      destination: {
        lat: destination.lat,
        lng: destination.lng,
        area: destinationName || "",   // schema expects area
      },
      seats,
      price: finalPrice,
      when: rideWhen,
      userId,
      bookings: [],
    });

    res.status(201).json({ message: "✅ Ride published", ride: rideDoc });
  } catch (err) {
    console.error("❌ Ride create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// (B) LIST — exclude current user's rides
app.get("/api/rides", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const rides = await Ride.find({ userId: { $ne: currentUserId } })
      .sort({ when: 1 })
      .populate("userId", "name email role")
      .select("origin destination seats price when userId");
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (C) SEARCH — by origin/destination area (for your FindRidesTab text search)
// ✅ Publish a new ride
app.post("/api/rides", auth, async (req, res) => {
  try {
    const { origin, destination, distance_km, duration_min, price_suggested, seats, when, eta_minutes } =
      req.body;

    const driver = await User.findById(req.user.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const newRide = new Ride({
      driver_id: driver._id,
      driver_name: driver.name,
      driver_role: driver.role,
      origin,
      destination,
      distance_km,
      duration_min,
      price_suggested,
      seats,
      when,
      eta_minutes,
    });

    await newRide.save();
    res.status(201).json({ message: "Ride published successfully", ride: newRide });
  } catch (err) {
    console.error("❌ Publish ride error:", err);
    res.status(500).json({ error: "Failed to publish ride" });
  }
});


// ─── Match Route ─────────────────────────
app.post("/api/match", auth, async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng, seats = 1 } = req.body || {};
    if ([origin_lat, origin_lng, dest_lat, dest_lng].some((v) => v === undefined)) {
      return res.status(400).json({ error: "Invalid origin/destination" });
    }

    const riderOrigin = { lat: Number(origin_lat), lng: Number(origin_lng) };
    const riderDest = { lat: Number(dest_lat), lng: Number(dest_lng) };

    const candidates = await Ride.find({
      seats: { $gte: seats },
      when: { $gte: new Date() },
    })
      .populate("userId", "name email role")
      .lean();

    const matches = candidates
      .map((r) => {
        const pickupKm = haversineDistance(riderOrigin, r.origin);
        const dropKm = haversineDistance(riderDest, r.destination);

        const originToPath = pointLineDistance(r.origin, r.destination, riderOrigin);
        const destToPath = pointLineDistance(r.origin, r.destination, riderDest);

        const alongRoute = originToPath < 5 && destToPath < 5;
        if (!alongRoute) return null;

        const baseDistance = haversineDistance(r.origin, r.destination);
        return {
          id: String(r._id),
          driver_name: r.userId?.name || "Driver",
          driver_email: r.userId?.email || null,
          driver_role: r.userId?.role || null,
          origin: r.origin,
          destination: r.destination,
          when: r.when ?? null,
          seats: r.seats,
          price_suggested: Number.isFinite(r.price)
            ? r.price
            : heuristicPrice({ base: 100, distance_km: baseDistance, demand: 1 }),
          match_score: Number((1 / (1 + pickupKm + dropKm)).toFixed(3)),
          eta_minutes: Math.max(3, Math.round(pickupKm / 0.5)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.match_score - a.match_score);

    res.json(matches);
  } catch (err) {
    console.error("❌ Match error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Price ───────────────────────────────
app.get("/api/price", async (req, res) => {
  try {
    const distance_km = Number(req.query.distance_km ?? 5);
    const duration_min = Number(req.query.duration_min ?? 15);
    const seats = Number(req.query.seats ?? 1);
    const when = String(req.query.when ?? new Date().toISOString());
    try {
      const ml = await runPython("pricing.py", { distance_km, duration_min, seats, when });
      return res.json({ price: Math.round(ml.price) });
    } catch {
      return res.json({ price: heuristicPrice({ base: 100, distance_km, demand: 1 }) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health ──────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ─── Start ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚗 Carpool backend running on http://localhost:${PORT}`);
});
