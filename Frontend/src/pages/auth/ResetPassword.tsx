import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Token inválido o faltante");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password,
      });

      setDone(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in fade-in duration-500">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">

          {/* LOGO */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-xl leading-none">SIGO</span>
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">
                Iliasa
              </span>
            </div>
          </div>

          {!done ? (
            <>
              <h2 className="text-xl font-black text-slate-900 mb-2 uppercase">
                Nueva contraseña
              </h2>

              <p className="text-slate-500 text-sm mb-6 font-medium">
                Ingresa tu nueva contraseña segura para tu cuenta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-10 h-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-10 h-12"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12 uppercase tracking-widest text-xs"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-xl font-black mb-2 uppercase">
                Contraseña actualizada
              </h2>

              <p className="text-slate-500 text-sm font-medium">
                Redirigiendo al login...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}