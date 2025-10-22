import { X, Car, User, MessageCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications = [
  {
    id: 1,
    type: 'ride_request',
    title: 'New Ride Request',
    message: 'Priya Singh wants to join your ride to Guindy',
    time: '2 min ago',
    unread: true,
    icon: User,
  },
  {
    id: 2,
    type: 'message',
    title: 'New Message',
    message: 'Sarah: "I\'m running 5 minutes late"',
    time: '10 min ago',
    unread: true,
    icon: MessageCircle,
  },
  {
    id: 3,
    type: 'ride_update',
    title: 'Ride Confirmed',
    message: 'Your ride with Mike Chen is confirmed for 9:00 AM',
    time: '1 hour ago',
    unread: false,
    icon: Car,
  },
  {
    id: 4,
    type: 'reminder',
    title: 'Ride Reminder',
    message: 'Your ride starts in 30 minutes',
    time: '2 hours ago',
    unread: false,
    icon: Clock,
  },
];

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
              <Badge variant="secondary" className="text-xs">
                {mockNotifications.filter(n => n.unread).length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Clear All */}
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
              Mark all as read
            </Button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {mockNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    notification.unread ? 'bg-accent/30 border-primary/20' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'ride_request' ? 'bg-primary/20 text-primary' :
                        notification.type === 'message' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'ride_update' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-coral rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State - if no notifications */}
          {mockNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}