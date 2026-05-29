import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, HardHat, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email,
      });
      setSent(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al enviar el enlace de recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in fade-in duration-500">
        {/* Card Contenedora */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
          
          {/* Logo SIGO */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">SIGO</span>
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Iliasa</span>
            </div>
          </div>

          {!sent ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Recuperar acceso</h2>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Ingresa el correo institucional asociado a tu cuenta para enviarte un enlace de seguridad.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Correo Electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@constructorailiasa.com"
                      className="pl-10 h-12 border-slate-200 focus:border-red-600 focus:ring-red-600 rounded-xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12 rounded-xl transition-all shadow-md shadow-red-100 uppercase tracking-widest text-xs"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </div>
                  ) : "Enviar enlace de acceso"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Revisa tu bandeja</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium px-4">
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 mb-8 border border-slate-100 font-bold leading-relaxed">
                ¿No recibiste nada? Revisa tu carpeta de spam o{" "}
                <button 
                  onClick={() => setSent(false)} 
                  className="text-red-600 font-black hover:underline uppercase tracking-tighter"
                >
                  intenta de nuevo
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-red-600 transition-colors font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          ¿Problemas con tu cuenta? Contacta a{" "}
          <a href="mailto:sistemas@constructorailiasa.com" className="text-red-500 hover:underline">
            Área de Sistemas
          </a>
        </div>
      </div>
    </div>
  );
}