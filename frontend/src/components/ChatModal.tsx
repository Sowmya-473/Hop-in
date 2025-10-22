import { useState } from 'react';
import { X, Send, MapPin, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

interface ChatModalProps {
  person: any;
  onClose: () => void;
}

const mockMessages = [
  {
    id: 1,
    sender: 'Sarah Johnson',
    message: 'Hi! I see you requested my ride to Guindy. I can pick you up from Anna Nagar Signal.',
    time: '10:30 AM',
    isMe: false,
  },
  {
    id: 2,
    sender: 'me',
    message: 'Perfect! What time should I be there?',
    time: '10:32 AM',
    isMe: true,
  },
  {
    id: 3,
    sender: 'Sarah Johnson',
    message: 'I\'ll be there at 9:00 AM sharp. Look for a blue Honda Civic, license plate TN01AB1234',
    time: '10:35 AM',
    isMe: false,
  },
  {
    id: 4,
    sender: 'me',
    message: 'Got it! I\'ll be wearing a red jacket. See you tomorrow!',
    time: '10:37 AM',
    isMe: true,
  },
];

export function ChatModal({ person, onClose }: ChatModalProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-2xl z-50 overflow-hidden shadow-2xl max-w-sm mx-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">{person.avatar}</span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{person.name}</h2>
                <p className="text-sm text-green-600">Online</p>
              </div>
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

          {/* Trip Info Banner */}
          <Card className="m-4 mb-2">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Anna Nagar → Guindy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Today, 9:00 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  message.isMe 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent text-accent-foreground'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-white">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-full border-border"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}