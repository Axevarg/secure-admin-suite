import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, ShieldCheck, HardHat, Building2, ClipboardList, Truck, Package, Users, BarChart3, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/axios";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    console.log("LOGIN RESPONSE:", res.data);

    const { accessToken, refreshToken, user, permissions } = res.data;

    // 🔐 decidir storage según "Recordar sesión"
    const storage = rememberMe ? localStorage : sessionStorage;

    // 🧠 guardar sesión
    storage.setItem("token", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(user));
    storage.setItem("permissions", JSON.stringify(permissions)); // 🔥 CLAVE NUEVA

    // 🧹 limpiar el otro storage (evita conflictos)
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem("token");
    otherStorage.removeItem("refreshToken");
    otherStorage.removeItem("user");
    otherStorage.removeItem("permissions");

    // 🚀 redirigir al dashboard
    navigate("/dashboard");

  } catch (err: any) {
    alert(err.response?.data?.message || "Error al iniciar sesión");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-background flex">
      {/* Panel Izquierdo - Rojo Constructora */}
      <div className="hidden lg:flex lg:w-1/2 bg-red-700 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgxMHYtMmgtNHpNNiAzNHYtNEg0djRIMHYyaDEwdi0ySDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tighter">SIGO</span>
          </div>
          <p className="text-red-100 text-sm font-medium">Sistema de Gestión de Obra</p>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Control Total de tu<br />Inventario y Obra
            </h1>
            <p className="text-red-100/80 text-lg leading-relaxed max-w-md">
              Gestiona el avance de tus proyectos, controla insumos y coordina a tus trabajadores en tiempo real.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Control de Insumos", icon: Package },
              { label: "Asistencia de Trabajadores", icon: Users },
              { label: "Avance de Obra", icon: BarChart3 },
              { label: "Solicitud de Materiales", icon: ClipboardCheck },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-red-200/50 text-sm">
          © 2026 SIGO - Área de Sistemas. Constructora Iliasa.
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo móvil */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground text-xl">SIGO</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenido</h2>
            <p className="text-muted-foreground text-sm">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@constructorailiasa.com"
                  className="pl-10 focus-visible:ring-red-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <Link to="/forgot-password"  className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 focus-visible:ring-red-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c as boolean)}
                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Mantener sesión iniciada
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white border-0 transition-colors font-medium h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </div>
              ) : "Entrar al Sistema"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground text-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Servidor de Producción Activo
              </div>
              <p>v0.0.0 | Área de Sistemas - Constructora Iliasa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
