import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { 
  KeyRound, 
  ShieldCheck, 
  HardHat, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ActivateAccount() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = new URLSearchParams(window.location.search).get("token");

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Las contraseñas no coinciden.",
      });
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/activate-account", {
        token,
        password,
      });

      setIsSuccess(true);
      toast({
        title: "Cuenta activada",
        description: "Tu acceso a SIGO ha sido configurado correctamente.",
      });
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => navigate("/login"), 3000);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error de activación",
        description: err.response?.data?.message || "El enlace ha expirado o es inválido.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Card Principal */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">
          
          {/* Header con Branding */}
          <div className="bg-slate-900 p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Bienvenido a SIGO</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Constructorailiasa.com</p>
          </div>

          <div className="p-8">
            {!isSuccess ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <ShieldCheck size={18} strokeWidth={3} />
                    <span className="text-xs font-black uppercase tracking-widest">Seguridad de Acceso</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-800 leading-tight">Configura tu nueva contraseña</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Para finalizar tu registro, establece una contraseña segura para tu cuenta institucional.
                  </p>
                </div>

                <form onSubmit={handleActivate} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 border-slate-200 focus:ring-red-600 rounded-xl font-bold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Contraseña</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 h-12 border-slate-200 focus:ring-red-600 rounded-xl font-bold"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12 rounded-xl transition-all shadow-lg shadow-red-100 uppercase tracking-widest text-xs mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Activando Perfil...
                      </div>
                    ) : "Finalizar Activación"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">¡Todo listo!</h2>
                <p className="text-slate-500 text-sm font-medium mb-8">
                  Tu cuenta ha sido activada con éxito. Estamos redirigiéndote al portal de acceso...
                </p>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full animate-[progress_3s_ease-in-out]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Técnico */}
        <div className="mt-8 flex flex-col items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-red-500" /> Cifrado AES-256
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-red-500" /> Acceso Restringido
            </span>
          </div>
          <p>© 2026 Constructora Iliasa - Área de Sistemas</p>
        </div>
      </div>
    </div>
  );
}