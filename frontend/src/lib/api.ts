// src/lib/api.ts

let token: string | null = null;

/**
 * Save and retrieve JWT token
 */
export function setToken(t: string) {
  token = t;
  localStorage.setItem("auth_token", t);
}

export function getToken(): string | null {
  if (!token) {
    token = localStorage.getItem("auth_token");
  }
  return token;
}

const API_URL = import.meta.env.VITE_API_BASE;

/**
 * Helper: handle API responses
 */
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ API error:", res.status, errorText);
    throw new Error(errorText || `Request failed with ${res.status}`);
  }
  return res.json();
}

/**
 * Signup user
 */
export async function signup(data: {
  name: string;
  email: string;
  password: string;
  role: "driver" | "rider";
}) {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

/**
 * Login user
 */
export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await handleResponse(res);
  if (result.token) setToken(result.token);
  return result;
}

/**
 * Get current user info (optional route support)
 */
export async function getUserProfile() {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

/**
 * Publish a ride
 */
/**
 * Publish a ride (aligned with backend schema)
 */
export async function publishRide(rideData: any) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/rides`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rideData),
  });
  if (!res.ok) throw new Error("Failed to publish ride");
  return await res.json();
}


/**
 * Get all rides (excluding current user's rides)
 */
export async function getRides() {
  const res = await fetch(`${API_URL}/rides`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

/**
 * Match rides (search for rides near given coordinates)
 */
export async function requestMatch(data: {
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  seats: number;
}) {
  console.log("🔍 Searching for matches:", data);
  const res = await fetch(`${API_URL}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

/**
 * Get price suggestion (based on distance, duration, seats, time)
 */
export async function getPrice(data: {
  distance_km: number;
  duration_min: number;
  seats: number;
  when: string;
}) {
  const query = new URLSearchParams({
    distance_km: String(data.distance_km),
    duration_min: String(data.duration_min),
    seats: String(data.seats),
    when: data.when,
  });

  const res = await fetch(`${API_URL}/price?${query.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function fetchAvailableRides(origin: any, destination: any, userId: string) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/rides/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, userId }),
  });
  if (!res.ok) throw new Error("Failed to fetch rides");
  return res.json();
}

