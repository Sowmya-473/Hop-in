import { useState, useRef, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "./ui/button";
import { getUserProfile } from "../lib/api";
import { geocode } from "../lib/geocode";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { GoogleMap, Marker, Polyline, Autocomplete } from "@react-google-maps/api";

interface FindRidesTabProps {
  onDriverSelect?: (driver: any) => void;
}

export function FindRidesTab({ onDriverSelect }: FindRidesTabProps) {
  const [userName, setUserName] = useState("User");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [femaleOnlyMode, setFemaleOnlyMode] = useState(false);
  const [maleOnlyMode, setMaleOnlyMode] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeLine, setRouteLine] = useState<{ lat: number; lng: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };

  // 🧠 Fetch user profile
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUserProfile();
        if (user?.name) setUserName(user.name.split(" ")[0]);
      } catch {
        console.warn("⚠️ Could not load user profile, defaulting to generic name.");
      }
    }
    fetchUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return address.split(",").slice(0, 2).join(",").trim();
  };

  const formatDateTime = (d: string, t: string) => {
    const dateObj = new Date(`${d}T${t}`);
    const formattedDate = dateObj.toLocaleDateString("en-GB").replaceAll("/", "-");
    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { formattedDate, formattedTime };
  };

  // 📦 Handle search (fetch relevant rides)
  async function handleSearch() {
    try {
      setLoading(true);
      setErrorMsg("");
      setDrivers([]);

      if (!fromLocation || !toLocation) {
        alert("Please enter both From and To locations.");
        return;
      }

      const origin = await geocode(fromLocation);
      const destination = await geocode(toLocation);

      setOriginCoords(origin);
      setDestCoords(destination);

      // 🗺️ Route drawing — safe geometry decoding
      const routeRes = await fetch(
        `http://localhost:5004/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
      );

      if (!routeRes.ok) {
        console.warn("⚠️ Route API failed:", routeRes.status);
      } else {
        const routeData = await routeRes.json();

        // ✅ Safe geometry decoding
        if (routeData?.polyline && window.google?.maps?.geometry?.encoding) {
          const path = window.google.maps.geometry.encoding.decodePath(routeData.polyline);
          const coords = path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
          setRouteLine(coords);
          setRouteInfo({
            distance: routeData.distance_km,
            duration: routeData.duration_min,
          });
        } else {
          console.warn("⚠️ Geometry not loaded or missing polyline, using fallback.");
          setRouteLine([]);
        }
      }

      // 🧩 Get current user ID for filtering
      const user = await getUserProfile();
      const userId = user?._id;

      // 🚗 Fetch relevant rides
      const res = await fetch("http://localhost:5004/api/rides/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ origin, destination, userId }),
      });

      if (!res.ok) throw new Error("Failed to fetch rides");
      const data = await res.json();

      console.log("✅ Available rides:", data);

      // 🎯 Gender filter
      let filtered = data;
      if (femaleOnlyMode) filtered = filtered.filter((d: any) => d.femaleRidersOnly);
      if (maleOnlyMode) filtered = filtered.filter((d: any) => d.maleRidersOnly);

      setDrivers(filtered);
    } catch (err: any) {
      console.error("❌ Search error:", err);
      setErrorMsg("Failed to fetch rides. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (originCoords && destCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originCoords);
      bounds.extend(destCoords);
    }
  }, [originCoords, destCoords]);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">Find the best rides near you</p>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: "400px" }}>
        <GoogleMap
          mapContainerStyle={{ height: "100%", width: "100%" }}
          center={originCoords || defaultCenter}
          zoom={originCoords ? 12 : 5}
        >
          {originCoords && <Marker position={originCoords} />}
          {destCoords && <Marker position={destCoords} />}
          {routeLine.length > 0 && (
            <Polyline path={routeLine} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
          )}
        </GoogleMap>
        {routeInfo && (
          <p className="text-sm mt-2 text-muted-foreground text-center">
            Distance: {routeInfo.distance} km | Duration: {routeInfo.duration} min
          </p>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* From / To Inputs */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Autocomplete
              onLoad={(ac) => (originAutocompleteRef.current = ac)}
              onPlaceChanged={() => {
                const place = originAutocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                  setOriginCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  setFromLocation(place.formatted_address || "");
                }
              }}
            >
              <Input
                placeholder="From"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="pl-10 h-12"
              />
            </Autocomplete>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Autocomplete
              onLoad={(ac) => (destAutocompleteRef.current = ac)}
              onPlaceChanged={() => {
                const place = destAutocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                  setDestCoords({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  setToLocation(place.formatted_address || "");
                }
              }}
            >
              <Input
                placeholder="To"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="pl-10 h-12"
              />
            </Autocomplete>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
          </div>

          {/* Gender Filters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="female-only">Female drivers only</Label>
              <Switch
                id="female-only"
                checked={femaleOnlyMode}
                onCheckedChange={(v: boolean) => {
                  setFemaleOnlyMode(v);
                  if (v) setMaleOnlyMode(false);
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="male-only">Male drivers only</Label>
              <Switch
                id="male-only"
                checked={maleOnlyMode}
                onCheckedChange={(v: boolean) => {
                  setMaleOnlyMode(v);
                  if (v) setFemaleOnlyMode(false);
                }}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full bg-primary text-white">
            {loading ? "Searching…" : "Search Rides"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Drivers</h2>
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {drivers.map((d) => {
          const date = new Date(d.when);
          const formattedDate = date.toLocaleDateString("en-GB").replaceAll("/", "-");
          const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          return (
            <Card key={d._id} onClick={() => onDriverSelect?.(d)} className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 flex justify-between">
                <div>
                  <h3 className="font-medium">{d.driver_name || d.userId?.name || "Unknown Driver"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {shortenAddress(d.startLocation)} → {shortenAddress(d.destinationName)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{d.price}</p>
                  <p className="text-sm">{d.seats} seats</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!drivers.length && !loading && <p className="text-muted-foreground text-sm">No rides found.</p>}
      </div>
    </div>
  );
}
