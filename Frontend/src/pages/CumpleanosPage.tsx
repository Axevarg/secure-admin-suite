import { useEffect, useState, useMemo, useRef } from "react";
import api from "@/lib/axios";
import { Cake, PartyPopper, Phone, Briefcase, Calendar, Sparkles, Printer, Building2 } from "lucide-react";

interface Cumple {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string;
  foto_url?: string;
  estatus: string;
  telefono?: string;
  departamento?: string;
  puesto?: string;
  dia: number;
  mes: number;
  dias_faltantes: number;
  es_hoy: boolean;
  edad_actual: number;
  edad_cumple: number;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

const ESTATUS_DOT: Record<string, string> = {
  activo: "bg-emerald-500",
  inactivo: "bg-slate-400",
  vacaciones: "bg-blue-500",
};

const CONFETTI_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const pieces = Array.from({ length: 320 }, (_, index) => {
      const fromTop = index % 5 === 0;
      const fromLeft = index % 2 === 0;
      return {
        x: fromTop
          ? Math.random() * window.innerWidth
          : fromLeft
            ? -10
            : window.innerWidth + 10,
        y: fromTop ? -20 - Math.random() * 180 : window.innerHeight * (0.05 + Math.random() * 0.38),
        vx: fromTop ? (Math.random() - 0.5) * 3 : (fromLeft ? 1 : -1) * (5 + Math.random() * 9),
        vy: fromTop ? 1 + Math.random() * 4 : -9 - Math.random() * 10,
        gravity: 0.18 + Math.random() * 0.14,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        width: 6 + Math.random() * 10,
        height: 4 + Math.random() * 7,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      };
    });

    const startedAt = performance.now();
    let animationFrame = 0;

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.vy += piece.gravity;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;

        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        context.restore();
      });

      if (now - startedAt < 4800) animationFrame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    />
  );
}

export default function CumpleanosPage() {
  const [cumples, setCumples] = useState<Cumple[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesParaImprimir, setMesParaImprimir] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/colaboradores/cumpleanios")
      .then((r) => setCumples(r.data))
      .finally(() => setLoading(false));
  }, []);

  const deHoy = useMemo(() => cumples.filter((c) => c.es_hoy), [cumples]);
  const proximos = useMemo(() => cumples.filter((c) => !c.es_hoy), [cumples]);
  const siguienteCumple = proximos[0];

  // Agrupar los próximos por mes (respetando el orden de cercanía)
  const agrupados = useMemo(() => {
    const grupos: Record<number, Cumple[]> = {};
    proximos.forEach((c) => {
      if (!grupos[c.mes]) grupos[c.mes] = [];
      grupos[c.mes].push(c);
    });

    // Ordenar los grupos según el mes del cumpleaños más próximo dentro de cada uno
    return Object.entries(grupos)
      .map(([mes, items]) => ({
        mes: Number(mes),
        items,
        minDias: Math.min(...items.map((i) => i.dias_faltantes)),
      }))
      .sort((a, b) => a.minDias - b.minDias);
  }, [proximos]);

  const iniciales = (c: Cumple) =>
    `${c.nombre[0] ?? ""}${c.apellido_paterno[0] ?? ""}`.toUpperCase();

  const nombreCompleto = (c: Cumple) =>
    `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno ?? ""}`.trim();

  const etiquetaDias = (dias: number) => {
    if (dias === 0) return "¡Hoy!";
    if (dias === 1) return "Mañana";
    return `En ${dias} días`;
  };

  const imprimirMes = (mes: number) => {
    setMesParaImprimir(mes);
    window.setTimeout(() => window.print(), 100);
  };

  useEffect(() => {
    const limpiarImpresion = () => setMesParaImprimir(null);
    window.addEventListener("afterprint", limpiarImpresion);
    return () => window.removeEventListener("afterprint", limpiarImpresion);
  }, []);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Cargando cumpleaños...
        </p>
      </div>
    );

  return (
    <div className="birthday-page space-y-8 animate-in fade-in duration-500">
      <ConfettiBurst />
      {mesParaImprimir !== null && (
        <section className="birthday-print-area" aria-hidden="true">
          {cumples.filter((c) => c.mes === mesParaImprimir).map((c) => (
            <article className="birthday-print-card" key={c.id}>
              <div className="birthday-print-confetti">● ◆ ▲ ● ◆ ▲ ● ◆ ▲ ● ◆</div>
              <div className="birthday-print-kicker">SIGO · ILIASA CELEBRA CONTIGO</div>
              <div className="birthday-print-photo-wrap">
                {c.foto_url ? <img src={`${BASE_URL}${c.foto_url}`} alt={nombreCompleto(c)} /> : <div className="birthday-print-initials">{iniciales(c)}</div>}
              </div>
              <p className="birthday-print-small">¡Feliz cumpleaños!</p>
              <h1>{nombreCompleto(c)}</h1>
              {c.puesto && <p className="birthday-print-position">{c.puesto}</p>}
              <p className="birthday-print-message">Que este nuevo año de vida venga lleno de grandes proyectos, alegrías y muchos motivos para celebrar.</p>
              <div className="birthday-print-date">{c.dia} de {MESES[c.mes - 1]} · {c.edad_cumple} años</div>
              <div className="birthday-print-footer">Con aprecio, todo el equipo de ILIASA 🎉</div>
            </article>
          ))}
        </section>
      )}
      {/* HEADER */}
      <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-900/30">
              <Cake size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">
                Cumpleaños
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                {cumples.length} colaboradores con fecha registrada
              </p>
            </div>
          </div>

          {siguienteCumple && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <Sparkles size={18} className="shrink-0 text-amber-500" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">
                  Próximo festejo · {etiquetaDias(siguienteCumple.dias_faltantes)}
                </p>
                <p className="mt-0.5 max-w-52 truncate text-sm font-black uppercase text-slate-800">
                  {nombreCompleto(siguienteCumple)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HOY */}
{/* HOY */}
{deHoy.length > 0 && (
  <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2rem] p-8 shadow-lg shadow-amber-900/20 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <PartyPopper size={24} />
        <h2 className="font-black uppercase tracking-wide text-base">Celebrando hoy 🎉</h2>
      </div>
      <button type="button" onClick={() => imprimirMes(deHoy[0].mes)} className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition hover:bg-white/30">
        <Printer size={15} /> Imprimir mes
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {deHoy.map((c, index) => (
        <div
          key={c.id}
          className="overflow-hidden bg-white/15 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 hover:-translate-y-1 hover:bg-white/20 transition-all"
          style={{ animationDelay: `${index * 120}ms`, animationFillMode: "both" }}
        >
          {c.foto_url ? (
            <img
              src={`${BASE_URL}${c.foto_url}`}
              alt={nombreCompleto(c)}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="h-64 w-full bg-white/20 flex items-center justify-center text-6xl font-black">
              {iniciales(c)}
            </div>
          )}
          <div className="min-w-0 p-6">
            <p className="font-black text-lg uppercase truncate leading-tight">
              {nombreCompleto(c)}
            </p>
            <p className="text-xs font-bold uppercase text-white/70 truncate mt-1">
              {c.puesto ?? "Sin puesto"}
            </p>
            <p className="text-sm font-black uppercase text-white mt-1">
              Cumple {c.edad_cumple} años
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* PRÓXIMOS, AGRUPADOS POR MES */}
<div className="space-y-6">
  {agrupados.length === 0 && deHoy.length === 0 && (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 text-center">
      <Cake size={40} className="mx-auto text-slate-200 mb-3" />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">
        No hay cumpleaños registrados
      </p>
    </div>
  )}

  {agrupados.map((grupo) => (
    <div
      key={grupo.mes}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-red-600" />
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-700">{MESES[grupo.mes - 1]}</h3>
          <span className="text-[10px] font-black text-slate-300">({cumples.filter((c) => c.mes === grupo.mes).length})</span>
        </div>
        <button type="button" onClick={() => imprimirMes(grupo.mes)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
          <Printer size={14} /> Imprimir mes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 xl:grid-cols-3">
        {grupo.items.map((c) => (
          <div
            key={c.id}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative">
              {c.foto_url ? (
                <img
                  src={`${BASE_URL}${c.foto_url}`}
                  alt={nombreCompleto(c)}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-64 w-full bg-gradient-to-br from-amber-50 to-red-50 flex items-center justify-center text-6xl font-black text-amber-500">
                  {iniciales(c)}
                </div>
              )}
              <span
                className={`absolute right-4 top-4 h-3.5 w-3.5 rounded-full border-2 border-white shadow ${
                  ESTATUS_DOT[c.estatus] ?? "bg-slate-300"
                }`}
              />
              <div className="absolute bottom-4 right-4 rounded-xl bg-white/95 px-3 py-2 text-center shadow-lg backdrop-blur">
                <p className="text-lg font-black leading-none text-slate-900">{c.dia}</p>
                <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-amber-600">{MESES[c.mes - 1]}</p>
              </div>
            </div>

            <div className="min-w-0 p-5">
              <p className="truncate text-base font-black uppercase text-slate-800">
                {nombreCompleto(c)}
              </p>
              <div className="mt-2 space-y-1.5">
                {c.puesto && (
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400"><Briefcase size={12} className="text-amber-500" /> {c.puesto}</p>
                )}
                {c.departamento && (
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400"><Building2 size={12} className="text-amber-500" /> {c.departamento}</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className={`text-[9px] font-black uppercase tracking-wide ${
                  c.dias_faltantes <= 7 ? "text-amber-600" : "text-slate-300"
                }`}>{etiquetaDias(c.dias_faltantes)} · Cumple {c.edad_cumple}</p>
                {c.telefono && <Phone size={14} className="text-slate-300" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
    </div>
  );
}
