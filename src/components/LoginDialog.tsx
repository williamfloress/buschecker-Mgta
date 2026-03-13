import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setPassword("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema.",
      });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({ nombre, email, password, rol: "pasajero" });
      toast({
        title: "Cuenta creada",
        description: "Bienvenido. Ya puedes usar las funciones de pasajero.",
      });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error al crear cuenta",
        description: error.message || "No se pudo crear la cuenta. El correo puede estar en uso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 pb-8">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Ingresa tus credenciales para acceder a funciones adicionales"
              : "Regístrate para guardar paradas favoritas y acceder a más funciones"}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-3">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors text-left"
              >
                ¿No tienes cuenta? Crear cuenta
              </button>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="register-email">Correo electrónico</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="register-password">Contraseña</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors text-left"
              >
                ¿Ya tienes cuenta? Iniciar sesión
              </button>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
