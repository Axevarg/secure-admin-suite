import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RefreshCw, Smartphone, Wifi } from "lucide-react";

interface PruebaMovil {
  id: number;
  mensaje: string;
  dispositivo?: string | null;
  usuario_id?: string | null;
  creado_en: string;
}

export default function PruebaMovilPage() {
  const [registros, setRegistros] = useState<PruebaMovil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mensaje, setMensaje] = useState("Prueba enviada desde SIGO web");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      setError("");
      const { data } = await api.get("/prueba-movil");
      setRegistros(data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "No fue posible consultar las pruebas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = window.setInterval(() => cargar(), 10_000);
    return () => window.clearInterval(interval);
  }, [cargar]);

  const enviarDesdeWeb = async () => {
    if (!mensaje.trim()) return;

    try {
      setSending(true);
      setError("");
      await api.post("/prueba-movil", {
        mensaje: mensaje.trim(),
        dispositivo: "SIGO Web",
      });
      await cargar();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "No fue posible enviar la prueba");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-red-600/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-red-600 p-3 shadow-lg shadow-red-950/40">
              <Smartphone size={25} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">Sandbox temporal</p>
              <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">Prueba móvil</h1>
              <p className="mt-1 text-sm text-slate-300">Verifica que React Native puede guardar información en SIGO.</p>
            </div>
          </div>
          <Badge className="w-fit gap-2 bg-emerald-500/15 px-3 py-2 text-emerald-300 hover:bg-emerald-500/15">
            <Wifi size={14} /> Actualización cada 10 segundos
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Enviar desde SIGO</h2>
          <p className="mt-2 text-sm text-slate-500">Este botón valida el mismo endpoint que consumirá la aplicación móvil.</p>
          <div className="mt-6 space-y-3">
            <Input
              value={mensaje}
              maxLength={280}
              onChange={(event) => setMensaje(event.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
            />
            <Button
              onClick={enviarDesdeWeb}
              disabled={sending || !mensaje.trim()}
              className="h-12 w-full rounded-xl bg-red-600 font-black uppercase tracking-widest hover:bg-red-700"
            >
              {sending ? "Enviando..." : "Enviar prueba"}
            </Button>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
            Desde React Native se enviará el mismo mensaje, junto con el token de inicio de sesión y el nombre del dispositivo.
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Registros recibidos</h2>
              <p className="mt-1 text-xs text-slate-400">Últimos 100 mensajes enviados a la API.</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => cargar(true)} disabled={refreshing} className="rounded-xl border-slate-200">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </Button>
          </div>

          {error && <p className="m-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

          {loading ? (
            <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-slate-300">Cargando registros...</div>
          ) : registros.length === 0 ? (
            <div className="p-12 text-center">
              <Smartphone className="mx-auto mb-3 text-slate-200" size={34} />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Aún no hay pruebas enviadas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {registros.map((registro) => (
                <div key={registro.id} className="flex items-start gap-4 px-7 py-5">
                  <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">{registro.mensaje}</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {registro.dispositivo || "Dispositivo no informado"} · {new Date(registro.creado_en).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">#{registro.id}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
