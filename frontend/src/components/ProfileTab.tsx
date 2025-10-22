import { Edit, LogOut, Star, Car, MapPin, Phone, Mail, Wallet, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface ProfileTabProps {
  onDriverSelect?: (driver: any) => void;
  onChatOpen?: (person: any) => void;
  onLogout?: () => void;
  user?: { 
    name: string; 
    email: string;
    stats?: {
      ridesCompleted: number;
      moneySaved: number;
      totalRides: number;
      rating: number;
    };
  };
}

export function ProfileTab({ onDriverSelect, onChatOpen, onLogout, user: userData }: ProfileTabProps) {
  const user = {
    name: userData?.name || 'Alex Morgan',
    email: userData?.email || 'alex.morgan@email.com',
    phone: '+91 98765 43210',
    avatar: userData?.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AM',
    rating: userData?.stats?.rating || 4.8,
    totalRides: userData?.stats?.totalRides || 156,
    ridesCompleted: userData?.stats?.ridesCompleted || 12,
    moneySaved: userData?.stats?.moneySaved || 240,
    role: 'Driver & Passenger',
    memberSince: 'March 2023',
    verifications: ['Phone', 'Email', 'ID'],
  };

  const quickStats = [
    { label: 'Rides Completed', value: user.ridesCompleted.toString(), icon: TrendingUp, color: 'primary' },
    { label: 'Money Saved', value: `₹${user.moneySaved}`, icon: Wallet, color: 'coral' },
  ];

  const detailedStats = [
    { label: 'Total Rides', value: user.totalRides.toString(), icon: Car },
    { label: 'Rating', value: user.rating.toString(), icon: Star },
    { label: 'Cities', value: '3', icon: MapPin },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">{user.avatar}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-1">{user.name}</h2>
              <p className="text-muted-foreground mb-2">Member since {user.memberSince}</p>
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Rides & Savings */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Your Activity</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colorClass = stat.color === 'coral' ? 'from-coral/10 to-coral/5' : 'from-primary/10 to-primary/5';
            const valueColorClass = stat.color === 'coral' ? 'text-coral' : 'text-primary';
            return (
              <Card key={index} className={`bg-gradient-to-br ${colorClass}`}>
                <CardContent className="p-4 text-center">
                  <IconComponent className={`w-6 h-6 mx-auto mb-2 ${valueColorClass}`} />
                  <div className={`text-2xl font-semibold mb-1 ${valueColorClass}`}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          {detailedStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <IconComponent className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Verifications */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Verifications</h3>
          <div className="flex flex-wrap gap-2">
            {user.verifications.map((verification, index) => (
              <Badge key={index} variant="outline" className="text-green-700 border-green-200 bg-green-50">
                ✓ {verification} Verified
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start space-x-3 py-3 border border-border rounded-xl"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Profile</span>
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start space-x-3 py-3 border border-border rounded-xl"
        >
          <Car className="w-5 h-5" />
          <span>My Vehicles</span>
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start space-x-3 py-3 border border-border rounded-xl"
        >
          <MapPin className="w-5 h-5" />
          <span>Saved Locations</span>
        </Button>

        <Button 
          variant="destructive" 
          className="w-full justify-start space-x-3 py-3 rounded-xl"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>

      {/* App Info */}
      <Card className="bg-accent/30">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold text-foreground mb-2">Hop in</h3>
          <p className="text-sm text-muted-foreground">Version 2.1.0</p>
          <p className="text-xs text-muted-foreground mt-1">Making commuting better, together</p>
        </CardContent>
      </Card>
    </div>
  );
}