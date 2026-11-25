import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Camera, ExternalLink, Image as ImageIcon, LoaderCircle, MapPin, RefreshCw, Search, X } from "lucide-react";
import axios from "axios";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TipoFoto = "entrega" | "comprobante";
type EvidenciaFoto = {
  id: number;
  tipo: TipoFoto;
  sha256: string;
  capturada_en: string;
  lat: number;
  lng: number;
  precision_m: number | null;
  direccion: string | null;
};
type Evidencia = {
  id: number;
  usuario_id: string;
  usuario: string;
  titulo: string;
  created_at: string;
  fotos: EvidenciaFoto[];
};

const tipoLabel: Record<TipoFoto, string> = { entrega: "Entrega", comprobante: "Comprobante" };
const fechaHora = (fecha: string) => new Date(fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
const fechaLocalIso = (fecha: string) => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const mensajeError = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;

export default function EvidenciasEntregasAppPage() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fotoSeleccionada, setFotoSeleccionada] = useState<{ evidencia: Evidencia; foto: EvidenciaFoto } | null>(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");

  const cargarEvidencias = async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await api.get<Evidencia[]>("/evidencias-app");
      setEvidencias(respuesta.data);
    } catch (e: unknown) {
      setError(mensajeError(e, "No se pudieron cargar las evidencias de entregas."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarEvidencias(); }, []);

  useEffect(() => () => {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
  }, [fotoUrl]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-MX");
    return evidencias.filter((evidencia) => {
      const coincideTexto = !texto || [evidencia.titulo, evidencia.usuario, ...evidencia.fotos.map((foto) => foto.direccion || "")]
        .join(" ").toLocaleLowerCase("es-MX").includes(texto);
      const fecha = fechaLocalIso(evidencia.created_at);
      const coincideDesde = !fechaDesde || fecha >= fechaDesde;
      const coincideHasta = !fechaHasta || fecha <= fechaHasta;
      return coincideTexto && coincideDesde && coincideHasta;
    });
  }, [busqueda, evidencias, fechaDesde, fechaHasta]);

  const abrirFoto = async (evidencia: Evidencia, foto: EvidenciaFoto) => {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setFotoUrl(""); setErrorFoto(""); setFotoSeleccionada({ evidencia, foto }); setCargandoFoto(true);
    try {
      const respuesta = await api.get(`/evidencias-app/archivo/${evidencia.id}/${foto.tipo}`, { responseType: "blob" });
      setFotoUrl(URL.createObjectURL(respuesta.data));
    } catch (e: unknown) {
      setErrorFoto(mensajeError(e, "No se pudo abrir la fotografía."));
    } finally { setCargandoFoto(false); }
  };

  const cerrarFoto = () => { setFotoSeleccionada(null); setFotoUrl(""); setErrorFoto(""); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm sm:flex-row sm:items-center">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-xl bg-red-600 p-2 shadow-lg shadow-red-900/30"><Camera size={20} className="text-white" strokeWidth={2.5} /></div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Evidencias de Entregas (App)</h1>
          </div>
          <p className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Registro móvil de entregas y comprobantes</p>
        </div>
        <Button onClick={() => void cargarEvidencias()} disabled={cargando} className="relative z-10 h-12 rounded-2xl border-none bg-red-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/20 transition-all hover:bg-red-700 active:scale-95">
          <RefreshCw className={`mr-2 h-4 w-4 ${cargando ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid items-end gap-4 xl:grid-cols-[minmax(260px,1fr)_190px_190px_auto]">
          <label className="block min-w-0 space-y-2">
            <span className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Buscar evidencia</span>
            <span className="group relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-red-600" />
              <Input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="TÍTULO, USUARIO O DIRECCIÓN" className="h-12 w-full rounded-2xl border-slate-100 bg-slate-50/50 pl-12 pr-4 text-[10px] font-black uppercase tracking-wider outline-none transition-all focus:bg-white focus-visible:ring-red-600 focus-visible:ring-offset-0" />
            </span>
          </label>
          <label className="block min-w-0 space-y-2">
            <span className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Desde</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(event) => setFechaDesde(event.target.value)} className="h-12 w-full rounded-2xl border-slate-100 bg-slate-50/50 pl-11 pr-3 text-xs font-semibold text-slate-700 focus-visible:ring-red-600 focus-visible:ring-offset-0" />
            </span>
          </label>
          <label className="block min-w-0 space-y-2">
            <span className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Hasta</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(event) => setFechaHasta(event.target.value)} className="h-12 w-full rounded-2xl border-slate-100 bg-slate-50/50 pl-11 pr-3 text-xs font-semibold text-slate-700 focus-visible:ring-red-600 focus-visible:ring-offset-0" />
            </span>
          </label>
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-2 xl:min-w-40">
            <div className="whitespace-nowrap"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Encontrados</p><p className="text-lg font-black leading-tight text-slate-900">{filtradas.length}</p></div>
            {(busqueda || fechaDesde || fechaHasta) && <Button type="button" variant="ghost" size="sm" onClick={() => { setBusqueda(""); setFechaDesde(""); setFechaHasta(""); }} className="h-9 rounded-xl px-2 text-[9px] font-black uppercase text-slate-500 hover:bg-white hover:text-red-600"><X className="mr-1 h-3.5 w-3.5" />Limpiar</Button>}
          </div>
        </div>
      </div>

      {error && <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle size={18} />{error}</div>}

      {cargando ? <div className="flex justify-center rounded-[2.5rem] border border-slate-100 bg-white p-24 shadow-sm"><LoaderCircle className="animate-spin text-red-600" /></div> : filtradas.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <Camera className="mx-auto mb-5 text-slate-200" size={56} strokeWidth={1} />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{busqueda || fechaDesde || fechaHasta ? "No se encontraron evidencias con esos filtros" : "Aún no hay evidencias de entregas"}</p>
        </div>
      ) : <div className="space-y-5">
        {filtradas.map((evidencia) => <article key={evidencia.id} className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{evidencia.titulo}</h2>
                <span className="rounded-full bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">{evidencia.fotos.length} {evidencia.fotos.length === 1 ? "foto" : "fotos"}</span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">REGISTRO #{String(evidencia.id).padStart(3, "0")}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">{evidencia.usuario}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">{fechaHora(evidencia.created_at)}</p>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {(["entrega", "comprobante"] as TipoFoto[]).map((tipo) => {
              const foto = evidencia.fotos.find((item) => item.tipo === tipo);
              return <section key={tipo} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/50 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><span className="rounded-xl bg-white p-2 shadow-sm"><ImageIcon className="h-4 w-4 text-red-600" /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{tipoLabel[tipo]}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{foto ? fechaHora(foto.capturada_en) : "Sin fotografía"}</p></div></div>
                  {foto && <Button variant="outline" size="sm" onClick={() => void abrirFoto(evidencia, foto)} className="h-9 shrink-0 rounded-xl border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:border-red-100 hover:bg-red-50 hover:text-red-700"><ImageIcon className="mr-1.5 h-3.5 w-3.5 text-red-600" />Ver foto</Button>}
                </div>
                {foto ? <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" /><div className="min-w-0"><p className="text-[10px] font-semibold leading-relaxed text-slate-700">{foto.direccion || "Convirtiendo coordenadas en dirección…"}</p><p className="mt-1 text-[9px] text-slate-400">{Number(foto.lat).toFixed(6)}, {Number(foto.lng).toFixed(6)}{foto.precision_m != null ? ` · Precisión ±${Math.round(foto.precision_m)} m` : ""}</p></div></div>
                  <a href={`https://www.google.com/maps?q=${foto.lat},${foto.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-red-600 hover:text-red-800">Abrir mapa <ExternalLink size={10} /></a>
                </div> : <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-[9px] font-bold uppercase tracking-widest text-slate-300">No se adjuntó esta foto</div>}
              </section>;
            })}
          </div>
        </article>)}
      </div>}

      <Dialog open={Boolean(fotoSeleccionada)} onOpenChange={(abierto) => { if (!abierto) cerrarFoto(); }}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-auto rounded-[2.5rem] border-none p-0 shadow-2xl">
          <div className="h-1.5 w-full bg-red-600" />
          <DialogHeader className="px-8 pt-7">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600">Foto de {fotoSeleccionada ? tipoLabel[fotoSeleccionada.foto.tipo] : "evidencia"}</p>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">{fotoSeleccionada?.evidencia.titulo}</DialogTitle>
          </DialogHeader>
          <div className="px-8 pb-8">
            <div className="mt-4 flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {cargandoFoto ? <LoaderCircle className="animate-spin text-red-600" /> : errorFoto ? <p className="p-5 text-sm font-semibold text-red-700">{errorFoto}</p> : fotoUrl ? <img src={fotoUrl} alt={`Foto de ${fotoSeleccionada ? tipoLabel[fotoSeleccionada.foto.tipo] : "evidencia"}`} className="max-h-[60vh] w-full object-contain" /> : null}
            </div>
            {fotoSeleccionada && <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha y hora</p><p className="mt-1 text-xs font-bold text-slate-800">{fechaHora(fotoSeleccionada.foto.capturada_en)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ubicación</p><p className="mt-1 text-xs font-bold text-slate-800">{fotoSeleccionada.foto.direccion || "Dirección en proceso"}</p><p className="mt-1 text-[10px] text-slate-400">{Number(fotoSeleccionada.foto.lat).toFixed(6)}, {Number(fotoSeleccionada.foto.lng).toFixed(6)}</p></div>
            </div>}
            {fotoSeleccionada && <a href={`https://www.google.com/maps?q=${fotoSeleccionada.foto.lat},${fotoSeleccionada.foto.lng}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center rounded-2xl bg-red-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700"><MapPin className="mr-2 h-4 w-4" /> Abrir ubicación en Google Maps <ExternalLink className="ml-2 h-3 w-3" /></a>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
