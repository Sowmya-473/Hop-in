// src/App.tsx
import { useState } from "react";
import { Users, Car, User } from "lucide-react";
import { FindRidesTab } from "./components/FindRidesTab";
import { OfferRideTab } from "./components/OfferRideTab";
import { ProfileTab } from "./components/ProfileTab";
import { TopHeader } from "./components/TopHeader";
import { HamburgerMenu } from "./components/HamburgerMenu";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { ChatModal } from "./components/ChatModal";
import { DriverDetailsModal } from "./components/DriverDetailsModal";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { LoadScript } from "@react-google-maps/api";

// ✅ FIX: Added "geometry" to libraries
const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [user, setUser] = useState({
    name: "Alex",
    email: "alex@example.com",
    stats: {
      ridesCompleted: 12,
      moneySaved: 240,
      totalRides: 156,
      rating: 4.8,
    },
  });
  const [activeTab, setActiveTab] = useState("rides");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [chatWith, setChatWith] = useState<any>(null);

  const tabs = [
    { id: "rides", label: "Rides", icon: Users, component: FindRidesTab },
    { id: "drive", label: "Drive", icon: Car, component: OfferRideTab },
    { id: "profile", label: "Profile", icon: User, component: ProfileTab },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || FindRidesTab;

  const openDriverDetails = (driver: any) => setSelectedDriver(driver);
  const openChat = (person: any) => {
    setChatWith(person);
    setIsChatOpen(true);
  };

  const handleLogin = (userData = user) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignup = (userData = user) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({
      name: "",
      email: "",
      stats: {
        ridesCompleted: 0,
        moneySaved: 0,
        totalRides: 0,
        rating: 0,
      },
    });
    setAuthView("login");
    setActiveTab("rides");
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsChatOpen(false);
    setSelectedDriver(null);
    setChatWith(null);
  };

  const navigateToSignup = () => setAuthView("signup");
  const navigateToLogin = () => setAuthView("login");

  // 🔐 Authentication handling
  if (!isAuthenticated) {
    return authView === "signup" ? (
      <SignupPage onSignup={handleSignup} onNavigateToLogin={navigateToLogin} />
    ) : (
      <LoginPage onLogin={handleLogin} onNavigateToSignup={navigateToSignup} />
    );
  }

  return (
    // ✅ FIX: Geometry library included
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
      libraries={libraries}
    >
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
        {/* Header */}
        <TopHeader
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          onNotificationsToggle={() =>
            setIsNotificationsOpen(!isNotificationsOpen)
          }
        />

        {/* Active Tab */}
        <div className="flex-1 pb-20 pt-16">
          <ActiveComponent
            onDriverSelect={openDriverDetails}
            onChatOpen={openChat}
            onLogout={activeTab === "profile" ? handleLogout : undefined}
            userName={activeTab === "rides" ? user.name : undefined}
            user={activeTab === "profile" ? user : undefined}
          />
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-border shadow-lg">
          <div className="flex">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IconComponent className="w-6 h-6 mb-1" />
                  <span className="text-sm text-[rgba(139,127,214,1)]">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panels and Modals */}
        <HamburgerMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
        <NotificationsPanel
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        {selectedDriver && (
          <DriverDetailsModal
            driver={selectedDriver}
            onClose={() => setSelectedDriver(null)}
            onChat={() => openChat(selectedDriver)}
          />
        )}
        {isChatOpen && chatWith && (
          <ChatModal
            person={chatWith}
            onClose={() => {
              setIsChatOpen(false);
              setChatWith(null);
            }}
          />
        )}
      </div>
    </LoadScript>
  );
}
