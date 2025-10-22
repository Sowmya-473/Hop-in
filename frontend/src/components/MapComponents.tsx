import { useState } from 'react';
import { MapPin, Search, Calendar, Clock, Star, Users } from 'lucide-react';
import { Button } from './ui/button';
import { requestMatch, getPrice } from '../lib/api';
import { geocode } from '../lib/geocode';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface FindRidesTabProps {
  onDriverSelect?: (driver: any) => void;
  onChatOpen?: (person: any) => void;
  userName?: string;
}

export function FindRidesTab({ onDriverSelect, userName = "Alex" }: FindRidesTabProps) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [femaleOnlyMode, setFemaleOnlyMode] = useState(false);
  const [maleOnlyMode, setMaleOnlyMode] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter by gender if requested
  const filteredDrivers = femaleOnlyMode
    ? drivers.filter(d => d.gender === 'female')
    : maleOnlyMode
    ? drivers.filter(d => d.gender === 'male')
    : drivers;

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  async function handleSearch() {
    try {
      setLoading(true);
      if (!fromLocation || !toLocation) return;

      const origin = await geocode(fromLocation);
      const destination = await geocode(toLocation);

      const timeIso =
        selectedDate && selectedTime
          ? new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
          : new Date().toISOString();

      // 🔹 Fetch matches
      const matches = await requestMatch({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        time_epoch: Math.floor(new Date(timeIso).getTime() / 1000),
        seats: 1,
      });

      setDrivers(matches);

      // 🔹 Fetch suggested price
      const distance_km = Math.max(
        0.8,
        Math.sqrt(
          Math.pow(origin.lat - destination.lat, 2) +
          Math.pow(origin.lng - destination.lng, 2)
        ) * 111
      );
      const duration_min = Math.round((distance_km / 28) * 60);

      const priceRes = await getPrice({ distance_km, duration_min, seats: 1, when: timeIso });
      setSuggestedPrice(priceRes.price);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">{getGreeting()}, {userName}! 👋</h1>
        <p className="text-muted-foreground">Ready for your next adventure?</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Input placeholder="From" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="pl-10 h-12" />
          <Input placeholder="To" value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="pl-10 h-12" />

          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-12" />
            <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="h-12" />
          </div>

          {suggestedPrice && (
            <div className="bg-accent/50 p-3 rounded-xl text-sm">
              Suggested Price: <span className="font-semibold">₹{suggestedPrice}</span>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-2">
            <Label>
              Female drivers only
              <Switch checked={femaleOnlyMode} onCheckedChange={(v) => { setFemaleOnlyMode(v); if (v) setMaleOnlyMode(false); }} />
            </Label>
            <Label>
              Male drivers only
              <Switch checked={maleOnlyMode} onCheckedChange={(v) => { setMaleOnlyMode(v); if (v) setFemaleOnlyMode(false); }} />
            </Label>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full bg-coral text-white">
            {loading ? "Searching…" : "Search Rides"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Drivers</h2>
        {filteredDrivers.map((d) => (
          <Card key={d.id} onClick={() => onDriverSelect?.(d)} className="cursor-pointer">
            <CardContent className="p-4 flex justify-between">
              <div>
                <h3 className="font-medium">{d.driver_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {d.origin?.area || "Origin"} → {d.destination?.area || "Destination"}
                </p>
                <p className="text-sm">ETA: {d.eta_minutes} min</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{d.price_suggested}</p>
                <p className="text-sm">{d.seats} seats</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {!filteredDrivers.length && (
          <p className="text-muted-foreground text-sm">No rides found. Try different search.</p>
        )}
      </div>
    </div>
  );
}
