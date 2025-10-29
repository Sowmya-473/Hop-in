// src/components/DriverDetailsModal.tsx
import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, Star, Users, Clock, Car } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface DriverDetailsModalProps {
  driver: any;             // ride object from FindRidesTab
  onClose: () => void;
  onChat?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5004/api";

export function DriverDetailsModal({ driver, onClose, onChat }: DriverDetailsModalProps) {
  const [rideDetails, setRideDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  // 🔒 Prevent background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 🧭 Fetch ride details
  useEffect(() => {
    if (!driver?._id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/rides/${driver._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRideDetails(data);
      } catch (err) {
        console.error("❌ Failed to fetch ride details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [driver?._id]);

  // 🚗 Compute distance/duration
  useEffect(() => {
    const o = rideDetails?.origin || driver.origin;
    const d = rideDetails?.destination || driver.destination;
    if (!o?.lat || !o?.lng || !d?.lat || !d?.lng) return;

    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/route?originLat=${o.lat}&originLng=${o.lng}&destLat=${d.lat}&destLng=${d.lng}`
        );
        if (r.ok) {
          const j = await r.json();
          if (Number.isFinite(j.distance_km)) setDistanceKm(j.distance_km);
          if (Number.isFinite(j.duration_min)) setDurationMin(j.duration_min);
          return;
        }
        const dist = haversineKm(o.lat, o.lng, d.lat, d.lng);
        setDistanceKm(dist);
        setDurationMin((dist / 28) * 60);
      } catch {
        const dist = haversineKm(o.lat, o.lng, d.lat, d.lng);
        setDistanceKm(dist);
        setDurationMin((dist / 28) * 60);
      }
    })();
  }, [rideDetails, driver]);

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  const handleCall = () => {
    const phone = rideDetails?.userId?.phone || "+919876543210";
    window.open(`tel:${phone}`, "_self");
  };

  const handleText = () => {
    const phone = rideDetails?.userId?.phone || "+919876543210";
    window.open(`sms:${phone}`, "_self");
  };

  // ✅ Fixed: Request Ride properly scoped
  const handleRequestRide = async () => {
    const currentRide = rideDetails ?? driver ?? null;

    if (!currentRide?._id) {
      console.warn("⚠️ No valid ride found for request");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rides/${currentRide._id}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ note: "Ride request from client" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data?.ride) setRideDetails(data.ride);

      alert("✅ Ride request sent to driver!");
      onChat?.();
    } catch (err) {
      console.error("❌ Request ride failed:", err);
      alert("Could not send request. Please try again.");
    }
  };

  if (!rideDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <p className="text-gray-700 text-sm">
            {loading ? "Loading ride details..." : "No ride details found."}
          </p>
          <Button onClick={onClose} className="mt-3">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const driverName = rideDetails.userId?.name || rideDetails.driver_name || "Driver";
  const driverAvatar = driverName.charAt(0).toUpperCase();
  const formattedTime = new Date(rideDetails.when).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(rideDetails.when).toLocaleDateString("en-GB");

  const niceDist = distanceKm == null ? "—" : `${distanceKm.toFixed(2)} km`;
  const niceDur = durationMin == null ? "—" : `${Math.round(durationMin)} min`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom sheet (centered) */}
      <div
        className="
          fixed bottom-0 left-1/2 -translate-x-1/2
          bg-white rounded-t-2xl z-50 shadow-2xl
          w-full max-w-sm animate-slide-up
        "
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Ride Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
            {/* Route Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-foreground">
                        {rideDetails.startLocation || rideDetails.origin?.area || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">Starting point</p>
                    </div>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-muted h-4"></div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-coral rounded-full"></div>
                    <div>
                      <p className="font-medium text-foreground">
                        {rideDetails.destinationName ||
                          rideDetails.destination?.area ||
                          "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">Destination</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">{driverAvatar}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {driverName}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {rideDetails.rating || "4.8"}
                      </span>
                      <span className="text-sm text-muted-foreground">(127 reviews)</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Verified Driver
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {rideDetails.carModel || "Sedan"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{rideDetails.seats} seats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {formattedDate.replaceAll("/", "-")}, {formattedTime}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary">
                      ₹{rideDetails.price}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Trip Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="text-foreground">{formattedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="text-foreground">
                      {niceDist} • {niceDur}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground flex-shrink-0 mt-[6px]">Pickup</span>
                    <span className="text-foreground break-words ml-4 text-right">
                      {rideDetails.startLocation || rideDetails.origin?.area || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-border space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCall} className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </Button>
              <Button variant="outline" onClick={handleText} className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Text</span>
              </Button>
            </div>

            <Button
              onClick={handleRequestRide}
              className="w-full bg-[rgba(139,127,214,0.8)] hover:bg-coral/90 text-white font-semibold"
            >
              Request This Ride
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
