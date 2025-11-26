import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import UserModeToggle from "@/components/UserModeToggle";
import ThemeToggle from "@/components/ThemeToggle";
import LoginDialog from "@/components/LoginDialog";
import PassengerView from "@/pages/PassengerView";
import DriverView from "@/pages/DriverView";
import AdminView from "@/pages/AdminView";
import { Bus, LogOut, Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

function AppContent() {
  const { user, logout, isAdmin, isDriver, isPassenger } = useAuth();
  const [userMode, setUserMode] = useState<"passenger" | "driver" | "admin">("passenger");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  // Update mode when user changes
  useEffect(() => {
    if (user) {
      if (isAdmin && userMode !== "admin") {
        setUserMode("admin");
      } else if (isDriver && userMode !== "driver" && !isAdmin) {
        setUserMode("driver");
      } else if (isPassenger && userMode !== "passenger" && !isAdmin && !isDriver) {
        setUserMode("passenger");
      }
    } else {
      // Default to passenger view for public users
      setUserMode("passenger");
    }
  }, [isAdmin, isDriver, isPassenger, userMode, user]);

  // Determine which view to show based on role and mode
  const getCurrentView = () => {
    // Public access: always show passenger view (map + real-time tracking)
    if (!user) {
      return <PassengerView />;
    }

    // Authenticated users can access role-specific views
    // But protect driver and admin views - require authentication
    if (userMode === "admin") {
      if (!isAdmin) {
        // If user tries to access admin but isn't admin, show passenger view
        return <PassengerView />;
      }
      return <AdminView />;
    }
    if (userMode === "driver") {
      if (!isDriver) {
        // If user tries to access driver but isn't driver, show passenger view
        return <PassengerView />;
      }
      return <DriverView />;
    }
    return <PassengerView />;
  };

  const getFooterText = () => {
    if (!user) {
      return "Seguimiento de autobuses en tiempo real - Acceso público";
    }
    if (isAdmin && userMode === "admin") {
      return "Administración de paradas de autobús";
    }
    if (isDriver && userMode === "driver") {
      return "Actualiza tu ubicación en tiempo real";
    }
    return "Encuentra tu autobús en tiempo real";
  };

  return (
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
                  {user 
                    ? `${user.nombre} (${user.rol === "admin" ? "Administrador" : user.rol === "conductor" ? "Conductor" : "Pasajero"})`
                    : "Seguimiento de autobuses en tiempo real"
                  }
                </p>
              </div>
            </div>

            {/* Mode Toggle and Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {isAdmin && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      <Shield className="w-3 h-3" />
                      Admin
                    </div>
                  )}
                  <UserModeToggle 
                    mode={userMode} 
                    onModeChange={setUserMode}
                    userRole={user.rol}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsLoginDialogOpen(true)}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4">
        {getCurrentView()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground" data-testid="text-footer">
            Construido con OpenStreetMap • {getFooterText()}
          </p>
        </div>
      </footer>
      <LoginDialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;