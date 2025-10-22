import { X, Settings, AlertTriangle, Shield, HelpCircle, FileText, Star, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    { icon: Settings, label: 'App Settings', action: () => {} },
    { icon: Shield, label: 'Safety Center', action: () => {} },
    { icon: AlertTriangle, label: 'Emergency SOS', action: () => {}, danger: true },
    { icon: Star, label: 'Rate App', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: FileText, label: 'Terms & Privacy', action: () => {} },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 w-80 h-full bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Menu</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* User Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary">AM</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Alex Morgan</h3>
                  <p className="text-sm text-muted-foreground">alex.morgan@email.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={item.action}
                  className={`w-full justify-start space-x-3 py-3 px-4 h-auto ${
                    item.danger ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          <Separator className="my-6" />

          {/* Logout */}
          <Button 
            variant="outline" 
            className="w-full justify-start space-x-3 py-3 border-destructive text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>

          {/* App Version */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">Hop in v2.1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}