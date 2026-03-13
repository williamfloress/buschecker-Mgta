import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/services";

export type UserRole = "admin" | "conductor" | "pasajero";

export interface User {
  id: string;
  id_usuario: string; // Alias para compatibilidad con favoritos
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol?: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isDriver: boolean;
  isPassenger: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildUserFromSession(session: { user: { id: string; email?: string } }) {
  const profile = await profileService.getById(session.user.id);
  return {
    id: session.user.id,
    id_usuario: session.user.id,
    nombre: profile.nombre,
    email: session.user.email || "",
    rol: profile.rol as UserRole,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const userData = await buildUserFromSession(session);
          setUser(userData);
        } catch (error) {
          console.error("Error loading profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const userData = await buildUserFromSession(session);
            setUser(userData);
          } catch (error) {
            console.error("Error loading profile on auth change:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // El onAuthStateChange actualizará el user automáticamente
    if (data.session) {
      const userData = await buildUserFromSession(data.session);
      setUser(userData);
    }
  };

  const register = async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          rol: data.rol || "pasajero",
        },
      },
    });
    if (error) throw error;
    // El trigger handle_new_user crea el perfil automáticamente
    if (authData.session) {
      const userData = await buildUserFromSession(authData.session);
      setUser(userData);
    } else if (authData.user) {
      // Si hay confirmación de email, el session puede ser null
      // Esperar un momento para que el trigger cree el perfil
      await new Promise((r) => setTimeout(r, 500));
      const profile = await profileService.getById(authData.user.id);
      setUser({
        id: authData.user.id,
        id_usuario: authData.user.id,
        nombre: profile.nombre,
        email: authData.user.email || "",
        rol: profile.rol as UserRole,
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.rol === "admin";
  const isDriver = user?.rol === "conductor";
  const isPassenger = user?.rol === "pasajero";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
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
