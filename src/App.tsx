import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import UserModeToggle from "@/components/UserModeToggle";
import ThemeToggle from "@/components/ThemeToggle";
import PassengerView from "@/pages/PassengerView";
import DriverView from "@/pages/DriverView";
import { Bus } from "lucide-react";

function App() {
  const [userMode, setUserMode] = useState<"passenger" | "driver">("passenger");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Logo and Title */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold" data-testid="text-app-title">
                      BusTracker
                    </h1>
                    <p className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
                      Seguimiento de autobuses en tiempo real
                    </p>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-4">
                  <UserModeToggle 
                    mode={userMode} 
                    onModeChange={setUserMode}
                  />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto p-4">
            {userMode === "passenger" ? (
              <PassengerView />
            ) : (
              <DriverView />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground" data-testid="text-footer">
                Construido con OpenStreetMap • {userMode === "passenger" ? "Encuentra tu autobús" : "Actualiza tu ubicación"} en tiempo real
              </p>
            </div>
          </footer>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;