import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { userService } from "@/lib/services";

export type UserRole = "admin" | "conductor" | "pasajero";

export interface User {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isDriver: boolean;
  isPassenger: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userData = await userService.login(email, password);
      setUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const isAdmin = user?.rol === "admin";
  const isDriver = user?.rol === "conductor";
  const isPassenger = user?.rol === "pasajero";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin,
        isDriver,
        isPassenger,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

