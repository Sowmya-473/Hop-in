const API_URL = import.meta.env.VITE_API_BASE;

// src/lib/geocode.ts
export async function geocode(address: string): Promise<{ lat: number; lng: number }> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await res.json();

    if (data.status !== "OK" || !data.results.length) {
      console.error("Geocode API error:", data); // 👈 log full response
      throw new Error(`Geocode failed: ${data.status}`);
    }

    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch (err) {
    console.error("Geocode error:", err);
    throw new Error("Geocode failed");
  }
}



export async function getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const res = await fetch(
    `${API_URL}/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
  );
  if (!res.ok) throw new Error("Route failed");
  return res.json(); // { distance_km, duration_min, geometry }
}

