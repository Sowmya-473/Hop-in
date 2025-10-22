import { X, MapPin, Phone, MessageCircle, Star, Users, Clock, Car } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface DriverDetailsModalProps {
  driver: any;
  onClose: () => void;
  onChat: () => void;
}

export function DriverDetailsModal({ driver, onClose, onChat }: DriverDetailsModalProps) {
  const handleCall = () => {
    // In a real app, this would initiate a call
    window.open(`tel:+919876543210`, '_self');
  };

  const handleText = () => {
    // In a real app, this would open SMS app
    window.open(`sms:+919876543210`, '_self');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal - Slides up from bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 shadow-2xl max-w-sm mx-auto animate-slide-up">
        <div className="flex flex-col max-h-[80vh]">
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Ride Details</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Map Section */}
            <Card>
              <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 relative flex items-center justify-center rounded-t-lg">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Route Map</p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-foreground">Anna Nagar</p>
                      <p className="text-sm text-muted-foreground">Starting point</p>
                    </div>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-muted h-4"></div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-coral rounded-full"></div>
                    <div>
                      <p className="font-medium text-foreground">Guindy</p>
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
                    <span className="text-lg font-semibold text-primary">{driver.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{driver.name}</h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{driver.rating}</span>
                      <span className="text-sm text-muted-foreground">(127 reviews)</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">Verified Driver</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{driver.carModel}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{driver.seatsAvailable} seats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{driver.eta} away</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary">₹{driver.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Trip Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="text-foreground">Today, 9:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">45 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="text-foreground">22 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup Point</span>
                    <span className="text-foreground">Anna Nagar Signal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={handleCall}
                className="flex items-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </Button>
              <Button 
                variant="outline"
                onClick={handleText}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Text</span>
              </Button>
            </div>

            <Button 
              className="w-full bg-[rgba(139,127,214,0.8)] hover:bg-coral/90 text-coral-foreground"
            >
              Request This Ride
            </Button>
          </div>
        </div>
      </div>


    </>
  );
}