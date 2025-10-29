import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  AlertTriangle,
  XCircle,
  Check,
  X,
} from "lucide-react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { getToken } from "../lib/api";

interface OfferRideTabProps {
  onChatOpen?: (person: any) => void;
}

export function OfferRideTab({}: OfferRideTabProps) {
  const [startLocation, setStartLocation] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("3");

  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<any>(null);

  const [myRides, setMyRides] = useState<any[]>([]);
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5004/api";

  // ─── Route & Price ───────────────────────────────
  const calculateRouteAndPrice = () => {
    if (!startCoords || !destCoords) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: startCoords,
        destination: destCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          const distanceMeters = result.routes[0].legs[0].distance?.value || 0;
          const distanceKm = distanceMeters / 1000;
          const baseRate = 8;
          setSuggestedPrice(Math.max(1, Math.round(distanceKm * baseRate)));
        } else {
          setDirections(null);
          setSuggestedPrice(null);
        }
      }
    );
  };

  useEffect(() => {
    calculateRouteAndPrice();
  }, [startCoords, destCoords]);

  // ─── Publish Ride ───────────────────────────────
  const handlePublishRide = async () => {
    if (!startLocation || !destinationName || !startCoords || !destCoords || !date || !time) {
      alert("Please fill all details!");
      return;
    }
    if (suggestedPrice == null) {
      alert("Price not ready yet. Please confirm both start & destination.");
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        alert("Please log in first.");
        return;
      }
      const res = await fetch(`${API_BASE}/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin: startCoords,
          destination: destCoords,
          startLocation,
          destinationName,
          date,
          time,
          seats: Number(seats),
          price: suggestedPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to publish ride");

      // Reset form
      setStartLocation("");
      setDestinationName("");
      setDate("");
      setTime("");
      setSeats("3");
      setSuggestedPrice(null);
      setStartCoords(null);
      setDestCoords(null);
      setDirections(null);

      fetchMyRides();
      alert("Ride published successfully!");
    } catch (err: any) {
      console.error("❌ Publish ride error:", err);
      alert(err.message || "Failed to publish ride");
    }
  };

  // ─── Fetch Active Rides ───────────────────────────────
  const fetchMyRides = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/rides/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMyRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching my rides:", err);
    }
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  // ─── Respond to Ride Request ───────────────────────────────
  const respondToRequest = async (rideId: string, requestId: string, action: string) => {
    try {
      const res = await fetch(`${API_BASE}/rides/${rideId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
      }

      const data = await res.json();
      console.log("✅ Ride response success:", data);
      alert(`Ride request ${action}ed successfully`);

      // ✅ Immediately refresh driver’s rides
      fetchMyRides();
    } catch (err) {
      console.error("❌ Ride response error:", err);
      alert("Could not update request. Try again.");
    }
  };


  // ─── Cancel / End Ride ───────────────────────────────
  const cancelRide = async (rideId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      if (!confirm("Cancel this ride?")) return;
      const res = await fetch(`${API_BASE}/rides/${rideId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      fetchMyRides();
    } catch (err) {
      console.error("❌ Cancel ride error:", err);
    }
  };

  const endRide = async (rideId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      if (!confirm("Mark this ride as ended?")) return;
      const res = await fetch(`${API_BASE}/rides/${rideId}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to end ride");
      fetchMyRides();
      alert("Ride ended successfully!");
    } catch (err) {
      console.error("❌ End ride error:", err);
    }
  };

  const formatIST = (utcDateString: string) => {
    return new Date(utcDateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ─── JSX ───────────────────────────────
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Offer a Ride</h1>

      {/* Google Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: "400px" }}>
        <GoogleMap
          mapContainerStyle={{ height: "100%", width: "100%" }}
          center={startCoords || defaultCenter}
          zoom={startCoords ? 12 : 10}
        >
          {startCoords && <Marker position={startCoords} />}
          {destCoords && <Marker position={destCoords} />}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>

      {/* Publish Ride Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Start */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Autocomplete
              onLoad={(ac) => (startAutocompleteRef.current = ac)}
              onPlaceChanged={() => {
                const place = startAutocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                  setStartCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  setStartLocation(place.formatted_address || "");
                }
              }}
            >
              <Input
                placeholder="Start Location"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="pl-10"
              />
            </Autocomplete>
          </div>

          {/* Destination */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Autocomplete
              onLoad={(ac) => (destAutocompleteRef.current = ac)}
              onPlaceChanged={() => {
                const place = destAutocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                  setDestCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  setDestinationName(place.formatted_address || "");
                }
              }}
            >
              <Input
                placeholder="Destination"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                className="pl-10"
              />
            </Autocomplete>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Seats */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <select
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="border rounded-md px-3 py-2 flex-1"
            >
              <option value="1">1 seat</option>
              <option value="2">2 seats</option>
              <option value="3">3 seats</option>
              <option value="4">4 seats</option>
            </select>
          </div>

          {suggestedPrice !== null && (
            <div className="text-sm bg-accent/40 p-2 rounded-md">
              ₹{suggestedPrice} per seat (auto-calculated)
            </div>
          )}

          <Button className="w-full" onClick={handlePublishRide}>
            Publish Ride
          </Button>
        </CardContent>
      </Card>

      {/* My Active Rides */}
      {myRides.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Active Rides</h2>
          {myRides.map((ride) => {
            const isOpen = expandedRide === ride._id;
            return (
              <Card key={ride._id} className="mb-3">
                <CardContent className="p-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedRide(isOpen ? null : ride._id)}
                  >
                    <div>
                      <p className="font-medium">
                        {ride.startLocation} → {ride.destinationName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatIST(ride.when)} • {ride.seats} seats • ₹{ride.price} per seat
                      </p>
                    </div>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <p className="font-medium text-sm">
                        Requests ({ride.requests?.length || 0})
                      </p>

                      {ride.requests?.length ? (
                        ride.requests.map((r: any) => (
                          <div
                            key={r._id}
                            className="flex justify-between items-center bg-accent/30 rounded-md p-2"
                          >
                            <div>
                              <p className="font-semibold text-sm">{r.user?.name || "Rider"}</p>
                              <p className="text-xs text-muted-foreground">{r.user?.phone || ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.user?.phone && (
                                <>
                                  <Phone
                                    className="cursor-pointer text-gray-600"
                                    onClick={() => window.open(`tel:${r.user.phone}`, "_self")}
                                  />
                                  <MessageSquare
                                    className="cursor-pointer text-gray-600"
                                    onClick={() => window.open(`sms:${r.user.phone}`, "_self")}
                                  />
                                </>
                              )}

                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  r.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : r.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {r.status || "pending"}
                              </span>

                              {r.status !== "accepted" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2"
                                  onClick={() => respondToRequest(ride._id, r._id, "accepted")}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              {r.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2"
                                  onClick={() => respondToRequest(ride._id, r._id, "rejected")}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No requests yet.</p>
                      )}

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-700"
                          onClick={() => endRide(ride._id)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" /> End Ride
                        </Button>
                        <Button variant="destructive" onClick={() => cancelRide(ride._id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
