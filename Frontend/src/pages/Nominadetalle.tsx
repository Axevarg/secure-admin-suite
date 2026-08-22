import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Banknote,
  Users,
  Building2,
  Calendar,
  CreditCard,
  AlertCircle,
  Clock,
  Pencil,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Printer,
} from "lucide-react";

interface Periodo {
  id: number;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  obra_nombre: string;
  cuenta_nombre: string;
  estado: string;
  total_bruto: number;
  total_deducciones: number;
  total_neto: number;
}

interface Detalle {
  id: number;
  colaborador_id: string;
  numero_empleado: string;
  colaborador_nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  foto_url: string;
  puesto_nombre: string;
  departamento_nombre: string;
  obra_nombre: string;
  forma_pago: string;
  banco: string;
  clabe: string;

  salario_diario: number;
  dias_periodo: number;
  dias_trabajados: number;
  salario_base: number;
  horas_extra: number;
  monto_horas_extra: number;
  bonos: number;
  otros_ingresos: number;
  total_percepciones: number;

  faltas: number;
  monto_faltas: number;
  deducciones_imss: number;
  otras_deducciones: number;
  total_deducciones: number;

  neto_pagar: number;
  estado_pago: string;
  observaciones: string;
  obra_id?: number;
}

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

const ESTADO_CONFIG: Record<
  string,
  { bg: string; text: string; label: string; icon: JSX.Element }
> = {
  borrador: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    label: "Borrador",
    icon: <Clock size={14} />,
  },
  revision: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Revisión",
    icon: <AlertCircle size={14} />,
  },
  cerrada: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Cerrada",
    icon: <Lock size={14} />,
  },
  pagada: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Pagada",
    icon: <CheckCircle2 size={14} />,
  },
};

// ─── MODAL EDITAR DETALLE ─────────────────────────────────────────────────────
function EditarDetalleModal({
  detalle,
  onClose,
  onSaved,
}: {
  detalle: Detalle;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    dias_trabajados: String(detalle.dias_trabajados),
    horas_extra: String(detalle.horas_extra),
    bonos: String(detalle.bonos),
    otros_ingresos: String(detalle.otros_ingresos),
    faltas: String(detalle.faltas),
    deducciones_imss: String(detalle.deducciones_imss),
    otras_deducciones: String(detalle.otras_deducciones),
    observaciones: detalle.observaciones ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Preview en tiempo real
  const salBase =
    Number(detalle.salario_diario) * Number(form.dias_trabajados || 0);
  const precioH = Number(detalle.salario_diario) / 8;
  const montoHE = Number(form.horas_extra || 0) * precioH * 2;
  const totalPerc =
    salBase +
    montoHE +
    Number(form.bonos || 0) +
    Number(form.otros_ingresos || 0);
  const montoFalt = Number(detalle.salario_diario) * Number(form.faltas || 0);
  const totalDed =
    montoFalt +
    Number(form.deducciones_imss || 0) +
    Number(form.otras_deducciones || 0);
  const neto = totalPerc - totalDed;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/nomina/detalle/${detalle.id}`, {
        ...form,
        dias_trabajados: Number(form.dias_trabajados),
        horas_extra: Number(form.horas_extra),
        bonos: Number(form.bonos),
        otros_ingresos: Number(form.otros_ingresos),
        faltas: Number(form.faltas),
        deducciones_imss: Number(form.deducciones_imss),
        otras_deducciones: Number(form.otras_deducciones),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const SI =
    "w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-right";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
          <div>
            <span className="bg-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Ajustar nómina
            </span>
            <h2 className="text-lg font-black uppercase tracking-tighter mt-1">
              {detalle.colaborador_nombre} {detalle.apellido_paterno}
            </h2>
            <p className="text-slate-400 text-[9px] font-bold uppercase">
              Salario diario: ${fmt(detalle.salario_diario)} ·{" "}
              {detalle.dias_periodo} días del período
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* PERCEPCIONES */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  Percepciones
                </p>
              </div>
              {[
                {
                  label: "Días trabajados",
                  key: "dias_trabajados",
                  max: detalle.dias_periodo,
                },
                { label: "Horas extra", key: "horas_extra" },
                { label: "Bonos ($)", key: "bonos" },
                { label: "Otros ingresos ($)", key: "otros_ingresos" },
              ].map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    {f.label}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={f.max}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    className={SI}
                  />
                </div>
              ))}
            </div>

            {/* DEDUCCIONES */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  Deducciones
                </p>
              </div>
              {[
                { label: "Faltas (días)", key: "faltas" },
                { label: "IMSS ($)", key: "deducciones_imss" },
                { label: "Otras deducciones ($)", key: "otras_deducciones" },
              ].map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    {f.label}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    className={SI}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW EN TIEMPO REAL */}
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
              Vista previa del cálculo
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Salario base", value: salBase, color: "text-white" },
                {
                  label: "Total percepc.",
                  value: totalPerc,
                  color: "text-emerald-400",
                },
                {
                  label: "Total deduc.",
                  value: totalDed,
                  color: "text-red-400",
                },
                {
                  label: "Neto a pagar",
                  value: neto,
                  color: neto >= 0 ? "text-emerald-400" : "text-red-400",
                },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                    {r.label}
                  </p>
                  <p className={`text-sm font-black mt-1 ${r.color}`}>
                    ${fmt(r.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              rows={2}
              className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-xs resize-none outline-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-emerald-900/20"
          >
            {saving ? "Guardando..." : "Guardar ajustes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA DETALLE ───────────────────────────────────────────────────────────
export default function NominaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [editando, setEditando] = useState<Detalle | null>(null);
  const [actioning, setActioning] = useState(false);
  const [search, setSearch] = useState("");

  // Agrega el estado del filtro junto a los demás
  const [fObra, setFObra] = useState("");
  const [obras, setObras] = useState<{ id: number; nombre: string }[]>([]);

  // Carga las obras únicas del período
  useEffect(() => {
    const obrasUnicas = detalles
      .filter((d) => d.obra_nombre)
      .reduce(
        (acc, d) => {
          if (!acc.find((o) => o.nombre === d.obra_nombre)) {
            acc.push({ id: d.obra_id ?? 0, nombre: d.obra_nombre });
          }
          return acc;
        },
        [] as { id: number; nombre: string }[],
      );
    setObras(obrasUnicas);
  }, [detalles]);

  const load = () =>
    api.get(`/nomina/${id}`).then((r) => {
      setPeriodo(r.data.periodo);
      setDetalles(r.data.detalles);
    });

  useEffect(() => {
    load();
  }, [id]);

  const cerrar = async () => {
    if (!confirm("¿Cerrar el período? Ya no se podrán editar los montos."))
      return;
    setActioning(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      await api.patch(`/nomina/${id}/cerrar`, { usuario_id: user.id });
      load();
    } finally {
      setActioning(false);
    }
  };

  const pagar = async () => {
    if (
      !confirm(
        "¿Confirmar el pago de la nómina? Se generará un movimiento bancario automáticamente.",
      )
    )
      return;
    setActioning(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      await api.patch(`/nomina/${id}/pagar`, { usuario_id: user.id });
      load();
    } finally {
      setActioning(false);
    }
  };

  const detalleFiltrado = detalles.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      d.colaborador_nombre?.toLowerCase().includes(q) ||
      d.apellido_paterno?.toLowerCase().includes(q) ||
      d.obra_nombre?.toLowerCase().includes(q) ||
      d.puesto_nombre?.toLowerCase().includes(q);
    const matchObra = !fObra || d.obra_nombre === fObra;
    return matchSearch && matchObra;
  });

  const puedeEditar =
    periodo?.estado === "borrador" || periodo?.estado === "revision";

  if (!periodo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const est = ESTADO_CONFIG[periodo.estado] ?? ESTADO_CONFIG.borrador;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] p-8 overflow-hidden text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 30%, #10b981 0%, transparent 55%)",
          }}
        />

        <div className="relative z-10">
          <button
            onClick={() => navigate("/nomina")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5 font-black text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Volver a nóminas
          </button>

          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${est.bg} ${est.text}`}
                >
                  {est.icon} {est.label}
                </div>
                <span className="bg-white/10 text-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  {periodo.tipo}
                </span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter mt-1">
                {periodo.nombre}
              </h1>

              <div className="flex flex-wrap gap-4 mt-3 text-slate-400 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(periodo.fecha_inicio).toLocaleDateString("es-MX")}
                  {" → "}
                  {new Date(periodo.fecha_fin).toLocaleDateString("es-MX")}
                </span>
                {periodo.obra_nombre && (
                  <span className="flex items-center gap-1">
                    <Building2 size={11} /> {periodo.obra_nombre}
                  </span>
                )}
                {periodo.cuenta_nombre && (
                  <span className="flex items-center gap-1">
                    <CreditCard size={11} /> {periodo.cuenta_nombre}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={11} /> {detalles.length} colaboradores
                </span>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex gap-3 items-start flex-wrap shrink-0">
              {periodo.estado === "borrador" && (
                <button
                  onClick={cerrar}
                  disabled={actioning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white font-black text-[10px] uppercase tracking-widest h-11 px-5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Lock size={14} /> Cerrar período
                </button>
              )}
              {periodo.estado === "cerrada" && (
                <button
                  onClick={pagar}
                  disabled={actioning}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 text-white font-black text-[10px] uppercase tracking-widest h-11 px-5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
                >
                  <Banknote size={14} /> Pagar nómina
                </button>
              )}
              <button
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_API_URL}/nomina/periodos/${periodo.id}/dispersion-pdf${fObra ? `?obra=${encodeURIComponent(fObra)}` : ""}`,
                    "_blank",
                  )
                }
                className="bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest h-11 px-5 rounded-xl transition-all flex items-center gap-2"
              >
                <Printer size={14} />
                {fObra ? `Imprimir · ${fObra}` : "Imprimir todo"}
              </button>
            </div>
          </div>

          {/* RESUMEN TOTALES */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1">
                <TrendingUp size={10} /> Total bruto
              </p>
              <p className="text-xl font-black text-white mt-1">
                ${fmt(periodo.total_bruto)}
              </p>
            </div>
            <div className="bg-red-600/20 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black uppercase text-red-300 tracking-widest flex items-center justify-center gap-1">
                <TrendingDown size={10} /> Deducciones
              </p>
              <p className="text-xl font-black text-red-300 mt-1">
                -${fmt(periodo.total_deducciones)}
              </p>
            </div>
            <div className="bg-emerald-600/20 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-300 tracking-widest flex items-center justify-center gap-1">
                <Banknote size={10} /> Neto a pagar
              </p>
              <p className="text-2xl font-black text-emerald-300 mt-1">
                ${fmt(periodo.total_neto)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR + FILTRO OBRA */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3">
        <Input
          placeholder="Buscar colaborador o puesto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase"
        />
        <select
          value={fObra}
          onChange={(e) => setFObra(e.target.value)}
          className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 font-black text-[10px] uppercase outline-none min-w-[200px]"
        >
          <option value="">Todas las obras</option>
          {obras.map((o) => (
            <option key={o.nombre} value={o.nombre}>
              {o.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {[
                "Colaborador",
                "Obra / Puesto",
                "Días",
                "Salario Base",
                "Percepciones",
                "Deducciones",
                "Neto",
                "Estado",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="p-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {detalleFiltrado.map((d) => (
              <tr
                key={d.id}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                {/* COLABORADOR */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {d.foto_url ? (
                      <img
                        src={`${BASE_URL}${d.foto_url}`}
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shrink-0">
                        {d.colaborador_nombre?.[0]}
                        {d.apellido_paterno?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] font-black uppercase tracking-widest text-red-500">
                        {d.numero_empleado ?? "Sin número"}
                      </p>
                      <p className="font-black text-xs text-slate-800 uppercase truncate">
                        {d.colaborador_nombre} {d.apellido_paterno}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        ${fmt(d.salario_diario)}/día
                      </p>
                    </div>
                  </div>
                </td>

                {/* OBRA / PUESTO */}
                <td className="p-4">
                  <p className="text-[10px] font-black text-slate-600 uppercase">
                    {d.obra_nombre ?? "—"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {d.puesto_nombre ?? "—"}
                  </p>
                </td>

                {/* DÍAS */}
                <td className="p-4">
                  <div className="text-center">
                    <p className="font-black text-sm text-slate-800">
                      {d.dias_trabajados}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">
                      de {d.dias_periodo}
                    </p>
                    {d.faltas > 0 && (
                      <p className="text-[9px] text-red-500 font-black">
                        {d.faltas} falta{d.faltas > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </td>

                {/* SALARIO BASE */}
                <td className="p-4">
                  <p className="font-black text-sm text-slate-800">
                    ${fmt(d.salario_base)}
                  </p>
                  {d.horas_extra > 0 && (
                    <p className="text-[9px] font-bold text-blue-600">
                      +{d.horas_extra}h extra
                    </p>
                  )}
                  {d.bonos > 0 && (
                    <p className="text-[9px] font-bold text-emerald-600">
                      +${fmt(d.bonos)} bono
                    </p>
                  )}
                </td>

                {/* TOTAL PERCEPCIONES */}
                <td className="p-4">
                  <p className="font-black text-sm text-emerald-600">
                    ${fmt(d.total_percepciones)}
                  </p>
                </td>

                {/* TOTAL DEDUCCIONES */}
                <td className="p-4">
                  <p className="font-black text-sm text-red-600">
                    -${fmt(d.total_deducciones)}
                  </p>
                  {d.deducciones_imss > 0 && (
                    <p className="text-[9px] font-bold text-slate-400">
                      IMSS: ${fmt(d.deducciones_imss)}
                    </p>
                  )}
                </td>

                {/* NETO */}
                <td className="p-4">
                  <p className="font-black text-base text-slate-900">
                    ${fmt(d.neto_pagar)}
                  </p>
                  {d.forma_pago && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {d.forma_pago}
                    </p>
                  )}
                </td>

                {/* ESTADO PAGO */}
                <td className="p-4">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                      d.estado_pago === "pagado"
                        ? "bg-emerald-100 text-emerald-700"
                        : d.estado_pago === "cancelado"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {d.estado_pago === "pagado" ? (
                      <Check size={10} />
                    ) : d.estado_pago === "cancelado" ? (
                      <X size={10} />
                    ) : (
                      <Clock size={10} />
                    )}
                    {d.estado_pago}
                  </div>
                </td>

                {/* ACCIONES */}
                <td className="p-4">
                  {puedeEditar && (
                    <button
                      onClick={() => setEditando(d)}
                      className="p-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Ajustar"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {detalleFiltrado.length === 0 && (
          <p className="text-center py-16 text-slate-300 font-black text-[10px] uppercase tracking-widest">
            Sin colaboradores en este período
          </p>
        )}
      </div>

      {/* MODAL EDITAR DETALLE */}
      {editando && (
        <EditarDetalleModal
          detalle={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            load();
          }}
        />
      )}
    </div>
  );
}
