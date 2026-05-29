import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  X,
  Search,
  FileUp,
  FileText,
  Trash2,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Wallet,
} from "lucide-react";

interface Cuenta {
  id: number;
  nombre: string;
  banco: string;
  balance: number;
}
interface Categoria {
  id: number;
  nombre: string;
  tipo: string;
}
interface Evidencia {
  id: number;
  file_url: string;
  file_name: string;
  tipo: string;
}
interface Movimiento {
  id: number;
  tipo: string;
  concepto: string;
  monto: number;
  fecha_movimiento: string;
  estado: string;
  cuenta_nombre: string;
  cuenta_destino_nombre: string;
  categoria_nombre: string;
  creador: string;
  num_evidencias: number;
}

type FilePreview = { file: File; preview: string; tipo: "foto" | "pdf" };

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

const TIPO_CONFIG: Record<
  string,
  { bg: string; text: string; icon: JSX.Element; label: string }
> = {
  ingreso: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <ArrowDownRight size={14} />,
    label: "Ingreso",
  },
  gasto: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <ArrowUpRight size={14} />,
    label: "Gasto",
  },
  transferencia: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <ArrowLeftRight size={14} />,
    label: "Transferencia",
  },
};

const ESTADO_CONFIG: Record<string, { icon: JSX.Element; text: string }> = {
  confirmado: { icon: <CheckCircle2 size={12} />, text: "text-emerald-600" },
  pendiente: { icon: <Clock size={12} />, text: "text-amber-600" },
  cancelado: { icon: <XCircle size={12} />, text: "text-slate-400" },
};

// ─── MODAL EVIDENCIAS ────────────────────────────────────────────────────────
function EvidenciasModal({
  movimientoId,
  onClose,
}: {
  movimientoId: number;
  onClose: () => void;
}) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () =>
    api
      .get(`/bancos/evidencias/${movimientoId}`)
      .then((r) => setEvidencias(r.data));

  useEffect(() => {
    load();
  }, [movimientoId]);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({
        file: f,
        preview: f.type.includes("pdf") ? "" : URL.createObjectURL(f),
        tipo: (f.type.includes("pdf") ? "pdf" : "foto") as "foto" | "pdf",
      })),
    ]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("movimiento_id", movimientoId.toString());
      files.forEach((f) => form.append("files", f.file));
      await api.post("/bancos/evidencias/upload", form);
      setFiles([]);
      load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <span className="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Evidencias
            </span>
            <h2 className="text-lg font-black uppercase tracking-tighter mt-1">
              Movimiento #{movimientoId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* DROP ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-red-500 bg-red-50"
                : "border-slate-200 hover:border-red-400 hover:bg-slate-50"
            }`}
          >
            <FileUp
              size={28}
              className={`mx-auto mb-2 ${dragging ? "text-red-600" : "text-slate-300"}`}
            />
            <p className="font-black text-xs uppercase text-slate-500">
              Arrastra archivos o{" "}
              <span className="text-red-600 underline">selecciona</span>
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            />
          </div>

          {/* PREVIEW */}
          {files.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
                Por subir ({files.length})
              </p>
              <div className="grid grid-cols-4 gap-3">
                {files.map((fp, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square border rounded-xl overflow-hidden group bg-slate-50"
                  >
                    {fp.tipo === "foto" ? (
                      <img
                        src={fp.preview}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-red-600">
                        <FileText size={28} />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-colors"
              >
                {uploading
                  ? "Subiendo..."
                  : `Confirmar ${files.length} archivo${files.length > 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* GUARDADAS */}
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
              Guardadas ({evidencias.length})
            </p>
            {evidencias.length === 0 ? (
              <p className="text-center py-8 text-slate-300 font-black text-[10px] uppercase">
                Sin evidencias
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {evidencias.map((ev) => (
                  <div
                    key={ev.id}
                    className="relative aspect-square border-2 border-slate-100 rounded-xl overflow-hidden group hover:border-red-500 transition-all bg-slate-50"
                  >
                    {ev.tipo === "foto" ? (
                      <img
                        src={`${BASE_URL}${ev.file_url}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <a
                        href={`${BASE_URL}${ev.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FileText size={28} />
                      </a>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[7px] text-white font-bold truncate">
                        {ev.file_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function BancosMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [evidenciasId, setEvidenciasId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [fCuenta, setFCuenta] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fQ, setFQ] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);


  // Form nuevo movimiento
  const [form, setForm] = useState({
    tipo: "gasto",
    cuenta_id: "",
    cuenta_destino_id: "",
    monto: "",
    concepto: "",
    categoria_id: "",
    fecha_movimiento: new Date().toISOString().split("T")[0],
    estado: "confirmado",
    observaciones: "",
  });

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (fCuenta) p.set("cuenta_id", fCuenta);
    if (fTipo) p.set("tipo", fTipo);
    if (fEstado) p.set("estado", fEstado);
    if (fDesde) p.set("desde", fDesde);
    if (fHasta) p.set("hasta", fHasta);
    if (fQ) p.set("q", fQ);
    return p.toString();
  };

  const load = () =>
    api
      .get(`/bancos/movimientos?${buildQuery()}`)
      .then((r) => setMovimientos(r.data));

  useEffect(() => {
    api.get("/bancos/cuentas").then((r) => setCuentas(r.data));
    api.get("/bancos/categorias").then((r) => setCategorias(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [fCuenta, fTipo, fEstado, fDesde, fHasta, fQ]);

  const handleSave = async () => {
    if (!form.cuenta_id || !form.monto || !form.tipo)
      return alert("Cuenta, tipo y monto son requeridos");

    setSaving(true);

    try {

      await api.post("/bancos/movimientos", {
        ...form,


        monto: Number(form.monto),

        cuenta_id: Number(form.cuenta_id),

        cuenta_destino_id: form.cuenta_destino_id
          ? Number(form.cuenta_destino_id)
          : null,

        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      });

      setOpenModal(false);

      setForm({
        tipo: "gasto",
        cuenta_id: "",
        cuenta_destino_id: "",
        monto: "",
        concepto: "",
        categoria_id: "",
        fecha_movimiento: new Date().toISOString().split("T")[0],
        estado: "confirmado",
        observaciones: "",
      });

      load();
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async (id: number) => {
    if (!confirm("¿Cancelar este movimiento?")) return;
    await api.patch(`/bancos/movimientos/${id}/cancelar`);
    load();
  };

    const cuentaSeleccionada = cuentas.find(
    (c) => String(c.id) === form.cuenta_id,
  );

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso" && m.estado !== "cancelado")
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movimientos
    .filter((m) => m.tipo === "gasto" && m.estado !== "cancelado")
    .reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        {/* EFECTO */}
        <div className="absolute right-0 top-0 w-40 h-40 bg-red-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />

        {/* IZQUIERDA */}
        <div className="relative z-10 flex items-start gap-4 min-w-0">
          {/* BOTÓN ATRÁS */}
          <button
            onClick={() => navigate("/bancos")}
            className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all group"
          >
            <ArrowLeft
              size={20}
              className="text-slate-700 group-hover:-translate-x-0.5 transition-transform"
              strokeWidth={2.5}
            />
          </button>

          {/* TITULO */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/30 shrink-0">
                <ArrowLeftRight
                  size={20}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>

              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
                Movimientos <span className="text-red-600">Bancarios</span>
              </h1>
            </div>

            {/* RESUMEN */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-1 mt-2">
              <span className="text-[9px] font-black uppercase text-emerald-600 whitespace-nowrap">
                ▲ Ingresos: ${fmt(totalIngresos)}
              </span>

              <span className="text-[9px] font-black uppercase text-red-600 whitespace-nowrap">
                ▼ Gastos: ${fmt(totalGastos)}
              </span>

              <span
                className={`text-[9px] font-black uppercase whitespace-nowrap ${
                  totalIngresos - totalGastos >= 0
                    ? "text-blue-600"
                    : "text-amber-600"
                }`}
              >
                = Balance: ${fmt(totalIngresos - totalGastos)}
              </span>
            </div>
          </div>
        </div>

        {/* BOTONES DERECHA */}
        <div className="relative z-10 flex flex-wrap gap-3 justify-end xl:ml-auto">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`h-12 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
              showFiltros
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtros
          </button>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-red-900/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* FILTROS */}
      {showFiltros && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="relative col-span-2 md:col-span-3 lg:col-span-2">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={14}
            />
            <Input
              placeholder="Buscar concepto..."
              value={fQ}
              onChange={(e) => setFQ(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold uppercase"
            />
          </div>
          <select
            value={fCuenta}
            onChange={(e) => setFCuenta(e.target.value)}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 text-[10px] font-black uppercase outline-none"
          >
            <option value="">Todas las cuentas</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            value={fTipo}
            onChange={(e) => setFTipo(e.target.value)}
            className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 text-[10px] font-black uppercase outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <Input
            type="date"
            value={fDesde}
            onChange={(e) => setFDesde(e.target.value)}
            className="h-11 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold"
          />
          <Input
            type="date"
            value={fHasta}
            onChange={(e) => setFHasta(e.target.value)}
            className="h-11 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold"
          />
        </div>
      )}

      {/* TABLA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {[
                "Tipo",
                "Concepto",
                "Cuenta",
                "Categoría",
                "Fecha",
                "Monto",
                "Estado",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="p-5 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movimientos.map((m) => {
              const tc = TIPO_CONFIG[m.tipo] ?? TIPO_CONFIG.gasto;
              const ec = ESTADO_CONFIG[m.estado] ?? ESTADO_CONFIG.confirmado;
              return (
                <tr
                  key={m.id}
                  className={`group hover:bg-slate-50/50 transition-colors ${m.estado === "cancelado" ? "opacity-40" : ""}`}
                >
                  <td className="p-5">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${tc.bg} ${tc.text}`}
                    >
                      {tc.icon} {tc.label}
                    </div>
                  </td>
                  <td className="p-5 max-w-[180px]">
                    <p className="font-black text-xs text-slate-800 uppercase truncate">
                      {m.concepto ?? "—"}
                    </p>
                    {m.creador && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                        Pagó: {m.creador}
                      </p>
                    )}

                    {m.cuenta_destino_nombre && (
                      <p className="text-[9px] text-slate-400 font-bold">
                        → {m.cuenta_destino_nombre}
                      </p>
                    )}
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      {m.cuenta_nombre}
                    </p>
                  </td>
                  <td className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      {m.categoria_nombre ?? "—"}
                    </p>
                  </td>
                  <td className="p-5">
                    <p className="text-[10px] font-bold text-slate-500">
                      {new Date(m.fecha_movimiento).toLocaleDateString("es-MX")}
                    </p>
                  </td>
                  <td className="p-5">
                    <span
                      className={`font-black text-sm ${
                        m.tipo === "ingreso"
                          ? "text-emerald-600"
                          : m.tipo === "gasto"
                            ? "text-red-600"
                            : "text-blue-600"
                      }`}
                    >
                      {m.tipo === "gasto" ? "-" : "+"}${fmt(m.monto)}
                    </span>
                  </td>
                  <td className="p-5">
                    <div
                      className={`flex items-center gap-1 text-[9px] font-black uppercase ${ec.text}`}
                    >
                      {ec.icon} {m.estado}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEvidenciasId(m.id)}
                        className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all relative"
                        title="Evidencias"
                      >
                        <FileText size={14} />
                        {m.num_evidencias > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                            {m.num_evidencias}
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {movimientos.length === 0 && (
          <p className="text-center py-16 text-slate-300 font-black text-[10px] uppercase tracking-widest">
            Sin movimientos para los filtros seleccionados
          </p>
        )}
      </div>

      {/* MODAL NUEVO MOVIMIENTO */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpenModal(false)}
        >
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start shrink-0">
              <div>
                <span className="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Nuevo Movimiento
                </span>
                <h2 className="text-xl font-black uppercase tracking-tighter mt-2">
                  Registrar <span className="text-red-500">Movimiento</span>
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
                // En el botón "Registrar Movimiento", agrega la condición al disabled:
               
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-5">
              {/* TIPO */}
              <div className="grid grid-cols-3 gap-3">
                {(["gasto", "ingreso", "transferencia"] as const).map((t) => {
                  const tc = TIPO_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, tipo: t })}
                      className={`h-12 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                        form.tipo === t
                          ? `${tc.bg} ${tc.text} border-current`
                          : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                      }`}
                    >
                      {tc.icon} {tc.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Cuenta Origen *
                    </label>
                    <select
                      value={form.cuenta_id}
                      onChange={(e) =>
                        setForm({ ...form, cuenta_id: e.target.value })
                      }
                      className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-red-600/10"
                    >
                      <option value="">Seleccionar...</option>
                      {cuentas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>

                    {/* ← NUEVO: disponible solo para gasto y transferencia */}
                    {cuentaSeleccionada &&
                      (form.tipo === "gasto" ||
                        form.tipo === "transferencia") && (
                        <div
                          className={`flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase ${
                            cuentaSeleccionada.balance > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <Wallet size={12} />
                          Disponible:{" "}
                          <span className="font-black">
                            ${fmt(cuentaSeleccionada.balance)}
                          </span>
                          {form.monto &&
                            Number(form.monto) > cuentaSeleccionada.balance && (
                              <span className="ml-auto text-red-600 font-black flex items-center gap-1">
                                ⚠ Fondos insuficientes
                              </span>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                {form.tipo === "transferencia" && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Cuenta Destino *
                    </label>
                    <select
                      value={form.cuenta_destino_id}
                      onChange={(e) =>
                        setForm({ ...form, cuenta_destino_id: e.target.value })
                      }
                      className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-red-600/10"
                    >
                      <option value="">Seleccionar...</option>
                      {cuentas
                        .filter((c) => String(c.id) !== form.cuenta_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Monto *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.monto}
                    onChange={(e) =>
                      setForm({ ...form, monto: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Fecha *
                  </label>
                  <Input
                    type="date"
                    value={form.fecha_movimiento}
                    onChange={(e) =>
                      setForm({ ...form, fecha_movimiento: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Concepto / Descripción
                </label>
                <Input
                  placeholder="Ej: Pago de nómina semana 18"
                  value={form.concepto}
                  onChange={(e) =>
                    setForm({ ...form, concepto: e.target.value })
                  }
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Categoría
                  </label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) =>
                      setForm({ ...form, categoria_id: e.target.value })
                    }
                    className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-red-600/10"
                  >
                    <option value="">Sin categoría</option>
                    {categorias
                      .filter(
                        (c) =>
                          c.tipo === "ambos" ||
                          c.tipo === form.tipo ||
                          form.tipo === "transferencia",
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Estado
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value })
                    }
                    className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-red-600/10"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Observaciones
                </label>
                <textarea
                  placeholder="Notas adicionales..."
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-xs resize-none outline-none focus:ring-2 focus:ring-red-600/10"
                />
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3 shrink-0">
              <button
                onClick={() => setOpenModal(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 font-black text-[10px] uppercase tracking-widest text-white transition-colors shadow-lg shadow-red-900/20"
              >
                {saving ? "Guardando..." : "Registrar Movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EVIDENCIAS */}
      {evidenciasId && (
        <EvidenciasModal
          movimientoId={evidenciasId}
          onClose={() => setEvidenciasId(null)}
        />
      )}
    </div>
  );
}
