import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  FileText, Plus, X, Calendar, Building2,
  CreditCard, CheckCircle2, Clock, Lock,
  Banknote, ChevronRight, Users, AlertCircle,
} from "lucide-react";

interface Periodo {
  id: number;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  obra_id: number;
  obra_nombre: string;
  cuenta_nombre: string;
  estado: string;
  total_bruto: number;
  total_deducciones: number;
  total_neto: number;
  total_colaboradores: number;
  creado_por_nombre: string;
  created_at: string;
}

interface Obra { id: number; nombre: string; }
interface Cuenta { id: number; nombre: string; banco: string; }

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const ESTADO_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; icon: JSX.Element }> = {
  borrador:  { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   label: "Borrador",  icon: <Clock size={12} /> },
  revision:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Revisión",  icon: <AlertCircle size={12} /> },
  cerrada:   { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Cerrada",   icon: <Lock size={12} /> },
  pagada:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Pagada",    icon: <CheckCircle2 size={12} /> },
};

const TIPO_LABELS: Record<string, string> = {
  semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual",
};

export default function NominaLista() {
  const navigate = useNavigate();
  const [periodos, setPeriodos]   = useState<Periodo[]>([]);
  const [obras, setObras]         = useState<Obra[]>([]);
  const [cuentas, setCuentas]     = useState<Cuenta[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [fEstado, setFEstado]     = useState("");
const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    tipo: "semanal",
    fecha_inicio: "",
    fecha_fin: "",
    obra_id: "",
    cuenta_bancaria_id: "",
  });

const load = () => {
  const p = new URLSearchParams();

  if (fEstado) p.set("estado", fEstado);
  if (busqueda) p.set("search", busqueda);

  api.get(`/nomina?${p}`).then((r) => setPeriodos(r.data));
};

  useEffect(() => {
    api.get("/obras").then((r) => setObras(r.data));
    api.get("/bancos/cuentas").then((r) => setCuentas(r.data));
  }, []);

useEffect(() => {
  load();
}, [fEstado, busqueda]);

  // Auto-calcular fecha_fin según tipo
  const handleTipoChange = (tipo: string) => {
    const inicio = form.fecha_inicio ? new Date(form.fecha_inicio) : null;
    let fin = "";
    if (inicio) {
      const d = new Date(inicio);
      if (tipo === "semanal")    d.setDate(d.getDate() + 6);
      if (tipo === "quincenal")  d.setDate(d.getDate() + 14);
      if (tipo === "mensual")    d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() - 1);
      fin = d.toISOString().split("T")[0];
    }
    setForm({ ...form, tipo, fecha_fin: fin });
  };

  const periodosFiltrados = periodos.filter((p) =>
  p.nombre.toLowerCase().includes(busqueda.toLowerCase())
);

  const handleFechaInicio = (fecha: string) => {
    const d = new Date(fecha);
    let fin = "";
    if (form.tipo === "semanal")   { const f = new Date(d); f.setDate(f.getDate() + 5);  fin = f.toISOString().split("T")[0]; }
    if (form.tipo === "quincenal") { const f = new Date(d); f.setDate(f.getDate() + 14); fin = f.toISOString().split("T")[0]; }
    if (form.tipo === "mensual")   { const f = new Date(d); f.setMonth(f.getMonth() + 1); f.setDate(f.getDate() - 1); fin = f.toISOString().split("T")[0]; }
    setForm({ ...form, fecha_inicio: fecha, fecha_fin: fin });
  };

  const handleSave = async () => {
    if (!form.fecha_inicio || !form.fecha_fin)
      return alert("Las fechas son requeridas");
    setSaving(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      await api.post("/nomina", {
        ...form,
        obra_id:            form.obra_id            ? Number(form.obra_id)            : null,
        cuenta_bancaria_id: form.cuenta_bancaria_id ? Number(form.cuenta_bancaria_id) : null,
        usuario_id: user.id,
      });
      setOpenModal(false);
      setForm({ nombre: "", tipo: "quincenal", fecha_inicio: "", fecha_fin: "", obra_id: "", cuenta_bancaria_id: "" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const totalNominas = periodos.reduce((s, p) => s + Number(p.total_neto), 0);
  const enBorrador   = periodos.filter((p) => p.estado === "borrador").length;
  const pagadas      = periodos.filter((p) => p.estado === "pagada").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] p-8 overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 30%, #10b981 0%, transparent 55%), radial-gradient(circle at 20% 70%, #3b82f6 0%, transparent 55%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-emerald-900/50">
                <Banknote size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Módulo de <span className="text-red-400">Nómina</span>
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Control de pagos por período y obra
            </p>
          </div>

          <div className="flex gap-3 flex-wrap items-start">
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-xl font-black text-emerald-400">${fmt(totalNominas)}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total pagado</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-xl font-black text-amber-400">{enBorrador}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">En borrador</p>
            </div>
            <button
              onClick={() => setOpenModal(true)}
              className="bg-red-600 hover:bg-emerald-700 min-h-[4rem] px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/30 flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> Nuevo Período
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row gap-4">
<Input
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  placeholder="Buscar período..."
  className="h-12 flex-1 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
/>
        <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}
          className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-black text-[10px] uppercase outline-none min-w-[160px]">
          <option value="">Todos los estados</option> 
          <option value="borrador">Borrador</option>
          <option value="revision">Revisión</option>
          <option value="cerrada">Cerrada</option>
          <option value="pagada">Pagada</option>
        </select>
      </div>

      {/* GRID DE PERÍODOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {periodosFiltrados.map((p) => {
          const est = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.borrador;
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/nomina/${p.id}`)}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden"
            >
              <div className={`h-1.5 w-full ${
                p.estado === "pagada" ? "bg-emerald-500"
                : p.estado === "cerrada" ? "bg-blue-500"
                : p.estado === "revision" ? "bg-amber-500"
                : "bg-slate-300"
              }`} />

              <div className="p-6 space-y-4">
                {/* HEAD */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                        {TIPO_LABELS[p.tipo]}
                      </span>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${est.bg} ${est.text}`}>
                        {est.icon} {est.label}
                      </div>
                    </div>
                    <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">
                      {p.nombre}
                    </h2>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>

                {/* FECHAS + OBRA */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[9px] font-black text-slate-500 uppercase truncate">
                      {new Date(p.fecha_inicio).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      {" → "}
                      {new Date(p.fecha_fin).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[9px] font-black text-slate-500 uppercase truncate">
                      {p.obra_nombre ?? "Global"}
                    </p>
                  </div>
                </div>

                {/* MONTOS */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Bruto</p>
                    <p className="text-xs font-black text-slate-700 mt-0.5">${fmt(p.total_bruto)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black uppercase text-red-400 tracking-widest">Deduc.</p>
                    <p className="text-xs font-black text-red-600 mt-0.5">-${fmt(p.total_deducciones)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Neto</p>
                    <p className="text-xs font-black text-emerald-700 mt-0.5">${fmt(p.total_neto)}</p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                    <Users size={11} />
                    {p.total_colaboradores} colaboradores
                  </div>
                  {p.cuenta_nombre && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                      <CreditCard size={11} />
                      {p.cuenta_nombre}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {periodos.length === 0 && (
        <div className="text-center py-20">
          <Banknote size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="font-black text-[10px] uppercase text-slate-300 tracking-widest">
            Sin períodos de nómina registrados
          </p>
        </div>
      )}

      {/* MODAL CREAR PERÍODO */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpenModal(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
              <div>
                <span className="bg-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Nuevo Período
                </span>
                <h2 className="text-xl font-black uppercase tracking-tighter mt-2">
                  Generar <span className="text-emerald-400">Nómina</span>
                </h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">
                  Se calculará automáticamente para todos los colaboradores activos
                </p>
              </div>
              <button onClick={() => setOpenModal(false)}
                className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              {/* TIPO */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Tipo de período *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["semanal", "quincenal", "mensual"].map((t) => (
                    <button key={t} onClick={() => handleTipoChange(t)}
                      className={`py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${
                        form.tipo === t
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                      }`}>
                      {TIPO_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Fecha inicio *
                  </label>
                  <Input type="date" value={form.fecha_inicio}
                    onChange={(e) => handleFechaInicio(e.target.value)}
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Fecha fin *
                  </label>
                  <Input type="date" value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Nombre del período
                </label>
                <Input value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase"
                  placeholder="Ej: Nómina Quincenal Mayo 1-15" />
              </div>

              {form.fecha_inicio && form.fecha_fin && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-[10px] font-black uppercase text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Se generará nómina automática para todos los colaboradores activos
                  {form.obra_id ? ` asignados a la obra seleccionada` : ` de todas las obras`}
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => setOpenModal(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 font-black text-[10px] uppercase tracking-widest text-white transition-colors shadow-lg shadow-emerald-900/20">
                {saving ? "Generando..." : "Generar Nómina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}