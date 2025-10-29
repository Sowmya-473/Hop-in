// server.js
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { spawn } from "child_process";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
const PORT = process.env.PORT || 5004;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// ─── Models / Routes ─────────────────────
import User from "./models/User.js";
import Ride from "./models/Ride.js";
import auth from "./middleware/auth.js";
import rideRoutes from "./routes/rideRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// ─── App Setup ───────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(bodyParser.json());
app.use("/api/rides", rideRoutes);
app.use("/api/users", userRoutes);

// ─── MongoDB ─────────────────────────────
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

function heuristicPrice({ base = 100, distance_km = 5, demand = 1 }) {
  return Math.round(base + distance_km * 6 + base * 0.15 * demand);
}

function runPython(script, payload) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", [script, JSON.stringify(payload)], { cwd: process.cwd() });
    let stdout = "", stderr = "";
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

// ─── ✅ Authenticated User Profile ───────────────────────────
app.get("/api/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Count upcoming rides (for driver dashboard)
    const upcomingRides = await Ride.countDocuments({
      userId: req.user.id,
      when: { $gte: new Date() },
    });

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      upcomingRides,
    });
  } catch (err) {
    console.error("❌ /api/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Auth ────────────────────────────────
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "name, email, password, role required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    res.json({ message: "✅ User created", user: { _id: user._id, name, email, role } });
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

// ─── Geocode ─────────────────────────────
app.get("/api/geocode", async (req, res) => {
  try {
    const q = String(req.query.query || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.results.length) return res.status(404).json({ error: "Location not found" });
    const loc = data.results[0].geometry.location;
    res.json({ lat: loc.lat, lng: loc.lng, name: data.results[0].formatted_address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route Distance/Duration API ───────────────────────────────
app.get("/api/route", async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const apiKey = process.env.GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(400).json({ error: data.error_message || "No route found" });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    res.json({
      distance_km: leg.distance.value / 1000,
      duration_min: leg.duration.value / 60,
      summary: route.summary,
      start_address: leg.start_address,
      end_address: leg.end_address,
      polyline: route.overview_polyline.points,
    });
  } catch (err) {
    console.error("❌ /api/route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Ride Publishing (Timezone Fix Applied) ────────────────
app.post("/api/rides/add", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      origin, destination,
      startLocation, destinationName,
      seats = 1, price,
      when, date, time,
    } = req.body || {};

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng)
      return res.status(400).json({ error: "origin/destination required" });

    let rideWhen;
    if (when) {
      rideWhen = new Date(when);
    } else if (date && time) {
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      rideWhen = new Date(Date.UTC(year, month - 1, day, hour, minute) - istOffsetMs);
    } else {
      rideWhen = new Date();
    }

    const distance_km = Math.max(0.5, haversineDistance(origin, destination));
    const duration_min = Math.round((distance_km / 28) * 60);

    let finalPrice = Number.isFinite(price) ? Number(price) : undefined;
    if (!Number.isFinite(finalPrice)) {
      try {
        const ml = await runPython("pricing.py", { distance_km, duration_min, seats, when: rideWhen.toISOString() });
        finalPrice = Math.round(ml.price);
      } catch {
        finalPrice = heuristicPrice({ base: 100, distance_km, demand: 1 });
      }
    }

    const rideDoc = await Ride.create({
      origin: { lat: origin.lat, lng: origin.lng, area: startLocation || "" },
      destination: { lat: destination.lat, lng: destination.lng, area: destinationName || "" },
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

// ─── Ride Listing ─────────────────────────
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

// ─── Health ──────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ─── Start (Socket.IO Integration) ────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("ride-request", (data) => {
    console.log("📩 Ride request received:", data);
    io.to(data.driverId).emit("ride-request-received", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚗 Carpool backend + Socket.IO running on http://localhost:${PORT}`);
});
