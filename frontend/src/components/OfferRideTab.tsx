// src/components/OfferRideTab.tsx
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
// import { Switch } from "./ui/switch";
// import { Label } from "./ui/label";
import { getToken } from "../lib/api";

interface OfferRideTabProps {
  onChatOpen?: (person: any) => void;
}

export function OfferRideTab({}: OfferRideTabProps) {
  // Form state
  const [startLocation, setStartLocation] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("3");

  // Map/route state
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<any>(null);

  // Driver dashboard state
  const [myRides, setMyRides] = useState<any[]>([]);
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  // Refs
  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5004/api";

  // Calculate route + price (simple heuristic)
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

  // Publish a new ride
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
          price: suggestedPrice, // exact price, no fallback
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to publish ride");
      }
      // reset form
      setStartLocation("");
      setDestinationName("");
      setDate("");
      setTime("");
      setSeats("3");
      setSuggestedPrice(null);
      setStartCoords(null);
      setDestCoords(null);
      setDirections(null);

      fetchMyRides(); // refresh list
      alert("Ride published successfully!");
    } catch (err: any) {
      console.error("❌ Publish ride error:", err);
      alert(err.message || "Failed to publish ride");
    }
  };

  // Fetch driver’s active rides
  const fetchMyRides = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/rides/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch my rides");
      }
      const data = await res.json();
      setMyRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching my rides:", err);
    }
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  // Respond to passenger request
  const respondToRequest = async (rideId: string, userId: string, action: "accept" | "decline") => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/rides/${rideId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update request");
      }
      fetchMyRides();
    } catch (err) {
      console.error("❌ Ride response error:", err);
    }
  };

  // Cancel ride
  const cancelRide = async (rideId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      if (!confirm("Cancel this ride?")) return;
      const res = await fetch(`${API_BASE}/rides/${rideId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to cancel ride");
      }
      fetchMyRides();
    } catch (err) {
      console.error("❌ Cancel ride error:", err);
    }
  };

  // End ride (mark as ended)
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
      if (!res.ok) {
        throw new Error(data?.error || "Failed to end ride");
      }
      fetchMyRides();
      alert("Ride ended successfully!");
    } catch (err) {
      console.error("❌ End ride error:", err);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Heading */}
      <h1 className="text-2xl font-semibold mb-2">Offer a Ride</h1>

      {/* Google Map */}
      <div
        className="rounded-lg overflow-hidden border border-gray-200"
        style={{ height: "400px" }}
      >
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

          {/* Suggested price */}
          {suggestedPrice !== null && (
            <div className="text-sm bg-accent/40 p-2 rounded-md">
              ₹{suggestedPrice} per seat (auto-calculated)
            </div>
          )}

          {/* Publish */}
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
                  {/* Header row (collapsible) */}
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedRide(isOpen ? null : ride._id)}
                  >
                    <div>
                      <p className="font-medium">
                        {ride.startLocation} → {ride.destinationName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ride.when).toLocaleString()} • {ride.seats} seats • ₹{ride.price} per seat
                      </p>
                    </div>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <p className="font-medium text-sm">
                        Passengers ({ride.bookings?.length || 0})
                      </p>

                      {ride.bookings?.length ? (
                        ride.bookings.map((b: any) => (
                          <div
                            key={b._id}
                            className="flex justify-between items-center bg-accent/30 rounded-md p-2"
                          >
                            <div>
                              <p className="font-semibold text-sm">{b.user?.name || "Rider"}</p>
                              <p className="text-xs text-muted-foreground">{b.user?.phone || ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Call / Message */}
                              {b.user?.phone && (
                                <>
                                  <Phone
                                    className="cursor-pointer text-gray-600"
                                    onClick={() => window.open(`tel:${b.user.phone}`, "_self")}
                                  />
                                  <MessageSquare
                                    className="cursor-pointer text-gray-600"
                                    onClick={() => window.open(`sms:${b.user.phone}`, "_self")}
                                  />
                                </>
                              )}

                              {/* Status chip */}
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  b.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : b.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {b.status || "pending"}
                              </span>

                              {/* Accept / Decline */}
                              {b.status !== "accepted" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2"
                                  onClick={() => respondToRequest(ride._id, b.user._id, "accept")}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              {b.status !== "declined" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2"
                                  onClick={() => respondToRequest(ride._id, b.user._id, "decline")}
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

                      {/* End / Cancel */}
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
