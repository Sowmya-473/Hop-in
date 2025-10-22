import { Menu, Bell } from 'lucide-react';
import { Button } from './ui/button';

interface TopHeaderProps {
  onMenuToggle: () => void;
  onNotificationsToggle: () => void;
}

export function TopHeader({ onMenuToggle, onNotificationsToggle }: TopHeaderProps) {
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-sm border-b border-border z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onMenuToggle}
          className="p-2 hover:bg-accent rounded-lg"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </Button>
        
        <div className="flex items-center">
          <h1 className="font-semibold text-foreground">Hop in</h1>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onNotificationsToggle}
          className="p-2 hover:bg-accent rounded-lg relative"
        >
          <Bell className="w-6 h-6 text-foreground" />
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-coral rounded-full border-2 border-white"></div>
        </Button>
      </div>
    </div>
  );
}