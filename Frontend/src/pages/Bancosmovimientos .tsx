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
  Pencil, DollarSign, Eye,
  CreditCard, Paperclip
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
interface Abono {
  id: number;
  movimiento_id: number;
  monto: number;
  fecha_abono: string;
  observaciones?: string;
  registrado_por?: string;
  num_evidencias: number;
}
interface Movimiento {
  id: number;
  tipo: string;
  concepto: string;
  monto: number;
  fecha_movimiento: string;
  estado: string;
  cuenta_id?: number;
  cuenta_nombre: string;
  cuenta_banco?: string;
  proveedor_nombre: string;
  cuenta_destino_nombre: string;
  categoria_nombre: string;
  creador: string;
  num_evidencias: number;
  proveedor_id?: number;
  observaciones?: string;
  categoria_id: number;
  factura_uuid?: string | null;
  forma_pago?: "contado" | "credito" | null;
  num_cuotas?: number | null;
  tiene_comision?: boolean;
  monto_comision?: number | null;
  fecha_confirmacion?: string | null;
  remesa_id?: number | null;
  remesa_folio?: number | null;
  created_at?: string;
  confirmado_por_nombre?: string | null;
  monto_abonado?: number;
  saldo_pendiente?: number | null;
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

// ─── MINI EVIDENCIAS POR ABONO ───────────────────────────────────────────────
function AbonoEvidencias({
  abonoId,
  onUpload,
}: {
  abonoId: number;
  onUpload: () => void;
}) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () =>
    api.get(`/bancos/abonos/evidencias/${abonoId}`).then((r) => setEvidencias(r.data));

  useEffect(() => {
    load();
  }, [abonoId]);

  const handleFiles = async (fileList: File[]) => {
    if (!fileList.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("abono_id", abonoId.toString());
      fileList.forEach((f) => form.append("files", f));
      await api.post("/bancos/abonos/evidencias/upload", form);
      load();
      onUpload();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {evidencias.map((ev) => (
          <a
            key={ev.id}
            href={`${BASE_URL}${ev.file_url}`}
            target="_blank"
            rel="noreferrer"
            className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center hover:border-red-500 transition-colors shrink-0"
          >
            {ev.tipo === "foto" ? (
              <img src={`${BASE_URL}${ev.file_url}`} className="h-full w-full object-cover" />
            ) : (
              <FileText size={20} className="text-red-600" />
            )}
          </a>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-red-400 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Plus size={18} />
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        />
      </div>
      {uploading && (
        <p className="text-[9px] font-black uppercase text-slate-400">Subiendo...</p>
      )}
    </div>
  );
}

// ─── MODAL ABONOS ─────────────────────────────────────────────────────────────
function AbonosModal({
  movimiento,
  onClose,
  onUpdate,
}: {
  movimiento: Movimiento;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = () =>
    api.get(`/bancos/movimientos/${movimiento.id}/abonos`).then((r) => setAbonos(r.data));

  useEffect(() => {
    load();
  }, [movimiento.id]);

  const totalAbonado = abonos.reduce((s, a) => s + Number(a.monto), 0);
  const saldoPendiente = Number(movimiento.monto) - totalAbonado;
  const liquidado = saldoPendiente <= 0.01;
  const porcentaje = Math.min(100, (totalAbonado / Number(movimiento.monto)) * 100);

  const registrarAbono = async () => {
    if (!monto || Number(monto) <= 0) return alert("Ingresa un monto válido");
    if (Number(monto) > saldoPendiente + 0.01)
      return alert(`El abono no puede exceder el saldo pendiente ($${fmt(saldoPendiente)})`);
    setSaving(true);
    try {
      await api.post(`/bancos/movimientos/${movimiento.id}/abonos`, {
        monto: Number(monto),
        fecha_abono: fecha,
        observaciones: observaciones || null,
      });
      setMonto("");
      setObservaciones("");
      load();
      onUpdate();
    } catch (err: any) {
      alert(err?.response?.data?.msg ?? "Error al registrar abono");
    } finally {
      setSaving(false);
    }
  };

  const eliminarAbono = async (id: number) => {
    if (!confirm("¿Eliminar este abono? Esta acción no se puede deshacer.")) return;
    await api.delete(`/bancos/abonos/${id}`);
    load();
    onUpdate();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
          <div>
            <span className="bg-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <CreditCard size={11} /> Crédito
            </span>
            <h2 className="text-lg font-black uppercase tracking-tighter mt-2">
              Abonos · Movimiento #{movimiento.id}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              {movimiento.concepto}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* RESUMEN */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Total del movimiento
              </p>
              <p className="text-xl font-black text-slate-900">
                ${fmt(Number(movimiento.monto))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Saldo pendiente
              </p>
              <p className={`text-xl font-black ${liquidado ? "text-emerald-600" : "text-red-600"}`}>
                ${fmt(Math.max(0, saldoPendiente))}
              </p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all ${liquidado ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1.5">
            Abonado: ${fmt(totalAbonado)} ({porcentaje.toFixed(0)}%)
            {liquidado && <span className="text-emerald-600 ml-2">✓ Liquidado</span>}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* NUEVO ABONO */}
          {!liquidado && (
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Registrar nuevo abono
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Monto"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="h-11 rounded-xl border-slate-100 bg-white font-black text-sm"
                />
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-11 rounded-xl border-slate-100 bg-white font-bold text-xs"
                />
              </div>
              <Input
                placeholder="Observaciones (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="h-11 rounded-xl border-slate-100 bg-white font-bold text-xs"
              />
              <button
                onClick={registrarAbono}
                disabled={saving}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                {saving ? "Guardando..." : "Registrar Abono"}
              </button>
            </div>
          )}

          {/* LISTA DE ABONOS */}
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
              Historial de abonos ({abonos.length})
            </p>
            {abonos.length === 0 ? (
              <p className="text-center py-8 text-slate-300 font-black text-[10px] uppercase">
                Sin abonos registrados
              </p>
            ) : (
              <div className="space-y-2">
                {abonos.map((a) => (
                  <div key={a.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900">${fmt(Number(a.monto))}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {new Date(a.fecha_abono).toLocaleDateString("es-MX")} · {a.registrado_por ?? "—"}
                        </p>
                        {a.observaciones && (
                          <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                            {a.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                          className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all relative"
                          title="Comprobantes"
                        >
                          <Paperclip size={14} />
                          {a.num_evidencias > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                              {a.num_evidencias}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => eliminarAbono(a.id)}
                          className="p-2 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-xl transition-all"
                          title="Eliminar abono"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {expandedId === a.id && (
                      <AbonoEvidencias abonoId={a.id} onUpload={load} />
                    )}
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
  const [abonosModal, setAbonosModal] = useState<Movimiento | null>(null);
  const [saving, setSaving] = useState(false);
  const [detalleModal, setDetalleModal] = useState<Movimiento | null>(null);

  // Filtros
  const [fCuenta, setFCuenta] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fQ, setFQ] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const [uuidInput, setUuidInput] = useState("");
const [savingUuid, setSavingUuid] = useState(false);

  const [proveedores, setProveedores] = useState([]);
  // Agrega este estado junto a los demás
  const [editModal, setEditModal] = useState<Movimiento | null>(null);
const [editForm, setEditForm] = useState({
  concepto: "",
  monto: "",
  categoria_id: "",
  proveedor_id: "",
  observaciones: "",
  fecha_movimiento: "",
  cuenta_id: "",
  forma_pago: "" as "" | "contado" | "credito",
  num_cuotas: "",
  cuotas_indefinidas: false,
  tiene_comision: false,
  monto_comision: "",
});

  // Junto a las demás funciones
  const confirmar = async (id: number) => {
    if (!confirm("¿Confirmar este movimiento? Ya no podrá editarse.")) return;
    await api.patch(`/bancos/movimientos/${id}/confirmar`);
    load();
  };

  // Función para abrir el modal de edición
const editarMovimiento = (m: Movimiento) => {
  setEditForm({
    concepto: m.concepto ?? "",
    monto: String(m.monto),
    categoria_id: String(m.categoria_id ?? ""),
    proveedor_id: String(m.proveedor_id ?? ""),
    observaciones: m.observaciones ?? "",
    fecha_movimiento: m.fecha_movimiento?.split("T")[0] ?? "",
    cuenta_id: m.cuenta_id ? String(m.cuenta_id) : "",
    forma_pago: (m.forma_pago as "" | "contado" | "credito") ?? "",
    num_cuotas: m.num_cuotas ? String(m.num_cuotas) : "",
    cuotas_indefinidas: m.forma_pago === "credito" && !m.num_cuotas,
    tiene_comision: m.tiene_comision ?? false,
    monto_comision: m.monto_comision ? String(m.monto_comision) : "",
  });
  setEditModal(m);
};
const guardarFacturaUuid = async () => {
  if (!detalleModal) return;
  setSavingUuid(true);
  try {
    const res = await api.patch(
      `/bancos/movimientos/${detalleModal.id}/factura-uuid`,
      { factura_uuid: uuidInput || null },
    );
    setDetalleModal(res.data); // refresca el modal con el UUID guardado
    load(); // refresca la tabla
  } finally {
    setSavingUuid(false);
  }
};

  // Función para guardar edición
const guardarEdicion = async () => {
  if (!editModal) return;
  setSaving(true);
  try {
    await api.put(`/bancos/movimientos/${editModal.id}`, {
      ...editForm,
      monto: Number(editForm.monto),
      categoria_id: editForm.categoria_id ? Number(editForm.categoria_id) : null,
      proveedor_id: editForm.proveedor_id ? Number(editForm.proveedor_id) : null,
      cuenta_id: editForm.cuenta_id ? Number(editForm.cuenta_id) : null,
      forma_pago: editForm.forma_pago || null,
      num_cuotas: editForm.cuotas_indefinidas ? null : editForm.num_cuotas ? Number(editForm.num_cuotas) : null,
      tiene_comision: editForm.tiene_comision,
      monto_comision: editForm.tiene_comision ? Number(editForm.monto_comision || 0) : null,
    });
    setEditModal(null);
    load();
  } finally {
    setSaving(false);
  }
};

  useEffect(() => {
    api.get("/proveedores").then((r) => setProveedores(r.data));
  }, []);

  // Form nuevo movimiento
const [form, setForm] = useState({
  tipo: "gasto",
  cuenta_id: "",
  cuenta_destino_id: "",
  monto: "",
  concepto: "",
  categoria_id: "",
  proveedor_id: "",
  fecha_movimiento: new Date().toISOString().split("T")[0],
  estado: "pendiente",
  observaciones: "",
  factura_uuid: "",
  forma_pago: "" as "" | "contado" | "credito",
  num_cuotas: "",
  cuotas_indefinidas: false,
  tiene_comision: false,
  monto_comision: "",
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

  useEffect(() => {
  setUuidInput(detalleModal?.factura_uuid ?? "");
}, [detalleModal?.id]);

const handleSave = async () => {
  if (!form.cuenta_id || !form.monto || !form.tipo)
    return alert("Cuenta, tipo y monto son requeridos");

  setSaving(true);
  try {
    await api.post("/bancos/movimientos", {
      ...form,
      monto: Number(form.monto),
      cuenta_id: Number(form.cuenta_id),
      cuenta_destino_id: form.cuenta_destino_id ? Number(form.cuenta_destino_id) : null,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      factura_uuid: form.factura_uuid || null,
      forma_pago: form.forma_pago || null,
      num_cuotas: form.cuotas_indefinidas ? null : form.num_cuotas ? Number(form.num_cuotas) : null,
      tiene_comision: form.tiene_comision,
      monto_comision: form.tiene_comision ? Number(form.monto_comision || 0) : null,
    });

    setOpenModal(false);
    setForm({
      tipo: "gasto",
      cuenta_id: "",
      cuenta_destino_id: "",
      monto: "",
      concepto: "",
      categoria_id: "",
      proveedor_id: "",
      fecha_movimiento: new Date().toISOString().split("T")[0],
      estado: "pendiente",
      observaciones: "",
      factura_uuid: "",
      forma_pago: "",
      num_cuotas: "",
      cuotas_indefinidas: false,
      tiene_comision: false,
      monto_comision: "",
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
  .filter((m) => m.tipo === "ingreso" && m.estado === "confirmado")
  .reduce((s, m) => s + Number(m.monto), 0);
// ← Incluye la comisión bancaria como parte del gasto, y para créditos usa
// lo efectivamente abonado (no el monto total) — así el header cuadra con
// el saldo real que calcula el backend en getCuentas.
const totalGastos = movimientos
  .filter((m) => m.tipo === "gasto" && m.estado === "confirmado")
  .reduce((s, m) => {
    const base = m.forma_pago === "credito" ? Number(m.monto_abonado ?? 0) : Number(m.monto);
    const comision = m.tiene_comision ? Number(m.monto_comision ?? 0) : 0;
    return s + base + comision;
  }, 0);

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

    {/* ← NUEVO: FILTRO POR ESTADO */}
    <select
      value={fEstado}
      onChange={(e) => setFEstado(e.target.value)}
      className="h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 text-[10px] font-black uppercase outline-none"
    >
      <option value="">Todos los estados</option>
      <option value="pendiente">🟠 Pendiente</option>
      <option value="confirmado">🟢 Confirmado</option>
      <option value="cancelado">⚪ Cancelado</option>
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
              const esCreditoConfirmado = m.forma_pago === "credito" && m.estado === "confirmado";
              const pendienteCredito = m.saldo_pendiente ?? Number(m.monto);
              const liquidadoCredito = pendienteCredito <= 0.01;
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
                  <td className="p-5 max-w-[200px]">
                    <p className="font-black text-xs text-slate-800 uppercase truncate">
                      {m.concepto ?? "—"}
                    </p>
                    {m.proveedor_nombre && (
                      <p className="text-[9px] text-slate-400 font-bold">
                        PROVEEDOR: {m.proveedor_nombre}
                      </p>
                    )}
{m.creador && (
  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
    Registró: {m.creador}
  </p>
)}
{m.estado === "confirmado" && m.confirmado_por_nombre && (
  <p className="text-[9px] text-emerald-600 font-bold uppercase">
    Pagó: {m.confirmado_por_nombre}
  </p>
)}

                    {m.factura_uuid && (
  <p className="text-[8px] text-slate-400 font-mono truncate">
    UUID: {m.factura_uuid}
  </p>
)}
{m.forma_pago && (
  <p className="text-[9px] text-slate-400 font-bold uppercase">
    {m.forma_pago === "credito"
      ? `Crédito ${m.num_cuotas ? `(${m.num_cuotas} cuotas)` : "(indefinido)"}`
      : "Contado"}
  </p>
)}
{esCreditoConfirmado && (
  <p className={`text-[9px] font-black uppercase ${liquidadoCredito ? "text-emerald-600" : "text-amber-600"}`}>
    {liquidadoCredito ? "✓ Liquidado" : `Pendiente: $${fmt(pendienteCredito)}`}
  </p>
)}
{m.tiene_comision && (
  <p className="text-[9px] text-amber-600 font-black uppercase">
    Comisión: ${fmt(m.monto_comision ?? 0)}
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
                  <td className="p-1">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                      {m.estado === "confirmado" && (
  <button
    onClick={() => setDetalleModal(m)}
    className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
    title="Ver detalle completo"
  >
    <Eye size={14} />
  </button>
)}

{esCreditoConfirmado && (
  <button
    onClick={() => setAbonosModal(m)}
    className={`p-2 rounded-xl transition-all ${
      liquidadoCredito
        ? "bg-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-600"
        : "bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-600"
    }`}
    title="Abonos a crédito"
  >
    <CreditCard size={14} />
  </button>
)}

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

                      

                      {m.estado === "pendiente" && (
                        <>
                          <button
                            onClick={() => editarMovimiento(m)}
                            className="p-2 bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>

<button
  onClick={() => confirmar(m.id)}
  disabled={!m.cuenta_id}
  className="p-2 bg-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
  title={m.cuenta_id ? "Confirmar" : "Asigna una cuenta primero"}
>
  <CheckCircle2 size={14} />
</button>

                          <button
                            onClick={() => cancelar(m.id)}
                            className="p-2 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-xl transition-all"
                            title="Cancelar movimiento"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
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

              {form.tipo !== "transferencia" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Proveedor
                  </label>

                  <select
                    value={form.proveedor_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proveedor_id: e.target.value,
                      })
                    }
                    className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase"
                  >
                    <option value="">Sin proveedor</option>

                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* MODAL ABONOS */}
      {abonosModal && (
        <AbonosModal
          movimiento={abonosModal}
          onClose={() => setAbonosModal(null)}
          onUpdate={load}
        />
      )}

      {detalleModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    onClick={(e) => e.target === e.currentTarget && setDetalleModal(null)}
  >
    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
      {/* HEADER */}
      <div className="bg-slate-900 p-8 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
        <div className="relative z-10">
          <span className="bg-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
            <CheckCircle2 size={11} />
            Movimiento Confirmado
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tighter mt-3">
            Movimiento <span className="text-emerald-500">#{detalleModal.id}</span>
          </h2>
          {detalleModal.remesa_folio && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
              Vinculado a Remesa {detalleModal.remesa_folio}
            </p>
          )}
        </div>
        <button
          onClick={() => setDetalleModal(null)}
          className="relative z-10 bg-white/10 hover:bg-red-600 p-2.5 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* CUERPO */}
      <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-slate-50/30">

        {/* MONTO DESTACADO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Monto {detalleModal.tipo === "gasto" ? "(Gasto)" : detalleModal.tipo === "ingreso" ? "(Ingreso)" : "(Transferencia)"}
            </p>
            <p
              className={`text-3xl font-black mt-1 ${
                detalleModal.tipo === "ingreso"
                  ? "text-emerald-600"
                  : detalleModal.tipo === "gasto"
                    ? "text-red-600"
                    : "text-blue-600"
              }`}
            >
              {detalleModal.tipo === "gasto" ? "-" : "+"}${fmt(detalleModal.monto)}
            </p>
          </div>
          {!!detalleModal.tiene_comision && (
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
                Comisión aplicada
              </p>
              <p className="text-lg font-black text-amber-600 mt-1">
                ${fmt(detalleModal.monto_comision ?? 0)}
              </p>
            </div>
          )}
        </div>

        {/* DATOS GENERALES */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Datos Generales
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-x-8 gap-y-3 text-[11px]">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Concepto</span>
              <span className="font-bold text-slate-900 uppercase text-right">{detalleModal.concepto ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Fecha Movimiento</span>
              <span className="font-bold text-slate-900">
                {new Date(detalleModal.fecha_movimiento).toLocaleDateString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Cuenta</span>
              <span className="font-bold text-slate-900 uppercase text-right">
                {detalleModal.cuenta_nombre ?? "—"} {detalleModal.cuenta_banco ? `(${detalleModal.cuenta_banco})` : ""}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Categoría</span>
              <span className="font-bold text-slate-900 uppercase text-right">{detalleModal.categoria_nombre ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Proveedor</span>
              <span className="font-bold text-slate-900 uppercase text-right">{detalleModal.proveedor_nombre ?? "—"}</span>
            </div>
<div className="flex justify-between border-b border-slate-50 pb-2">
  <span className="font-black text-slate-400 uppercase">Registró</span>
  <span className="font-bold text-slate-900 uppercase text-right">{detalleModal.creador ?? "—"}</span>
</div>
<div className="flex justify-between border-b border-slate-50 pb-2">
  <span className="font-black text-slate-400 uppercase">Confirmó / Pagó</span>
  <span className="font-bold text-emerald-700 uppercase text-right">
    {detalleModal.confirmado_por_nombre ?? "—"}
  </span>
</div>
            {detalleModal.cuenta_destino_nombre && (
              <div className="flex justify-between border-b border-slate-50 pb-2 col-span-2">
                <span className="font-black text-slate-400 uppercase">Cuenta Destino</span>
                <span className="font-bold text-slate-900 uppercase text-right">{detalleModal.cuenta_destino_nombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* FACTURACIÓN Y PAGO */}
        {(detalleModal.factura_uuid || detalleModal.forma_pago) && (
<div className="space-y-3">
  <div className="flex items-center gap-3 px-1">
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
      Facturación y Forma de Pago
    </h3>
    <div className="h-px flex-1 bg-slate-200" />
  </div>

  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
    {/* Forma de pago heredada — solo lectura aquí */}
    {(detalleModal.forma_pago || detalleModal.tiene_comision) && (
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[11px]">
        {detalleModal.forma_pago && (
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="font-black text-slate-400 uppercase">Forma de Pago</span>
            <span className="font-bold text-slate-900 uppercase text-right">
              {detalleModal.forma_pago === "credito" ? "Crédito" : "Contado"}
            </span>
          </div>
        )}
        {detalleModal.forma_pago === "credito" && (
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="font-black text-slate-400 uppercase">Cuotas</span>
            <span className="font-bold text-slate-900 uppercase text-right">
              {detalleModal.num_cuotas ? detalleModal.num_cuotas : "Indefinidas"}
            </span>
          </div>
        )}
      </div>
    )}

    {/* ← NUEVO: progreso de abonos, solo si es crédito */}
    {detalleModal.forma_pago === "credito" && (
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            Progreso de pago a crédito
          </span>
          <span
            className={`text-[9px] font-black uppercase ${
              (detalleModal.saldo_pendiente ?? 0) <= 0.01 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {(detalleModal.saldo_pendiente ?? 0) <= 0.01
              ? "✓ Liquidado"
              : `Pendiente: $${fmt(detalleModal.saldo_pendiente ?? Number(detalleModal.monto))}`}
          </span>
        </div>
        <button
          onClick={() => {
            setAbonosModal(detalleModal);
            setDetalleModal(null);
          }}
          className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard size={14} /> Ver / Registrar Abonos
        </button>
      </div>
    )}

    {/* UUID de factura — editable solo aquí, porque el movimiento ya está confirmado */}
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
        UUID de Factura (Folio Fiscal)
        {detalleModal.factura_uuid && (
          <span className="text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={11} /> Registrado
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="Ej: 3A1B2C3D-...-9F0E"
          value={uuidInput}
          onChange={(e) => setUuidInput(e.target.value)}
          className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-xs flex-1"
        />
        <button
          onClick={guardarFacturaUuid}
          disabled={savingUuid || uuidInput === (detalleModal.factura_uuid ?? "")}
          className="h-12 px-5 rounded-xl bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest transition-colors shrink-0"
        >
          {savingUuid ? "..." : "Guardar"}
        </button>
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase ml-1">
        Se puede capturar solo después de confirmado el pago
      </p>
    </div>
  </div>
</div>
        )}

        {/* TRAZABILIDAD */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Trazabilidad
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-x-8 gap-y-3 text-[11px]">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Creado</span>
              <span className="font-bold text-slate-900">
                {detalleModal.created_at
                  ? new Date(detalleModal.created_at).toLocaleString("es-MX")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="font-black text-slate-400 uppercase">Confirmado</span>
              <span className="font-bold text-emerald-700">
                {detalleModal.fecha_confirmacion
                  ? new Date(detalleModal.fecha_confirmacion).toLocaleString("es-MX")
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* OBSERVACIONES */}
        {detalleModal.observaciones && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                Observaciones
              </h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-5 text-[11px] font-medium leading-relaxed">
              {detalleModal.observaciones}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-8 border-t border-slate-100 flex justify-between items-center shrink-0 bg-white">
        <button
          onClick={() => {
            setEvidenciasId(detalleModal.id);
            setDetalleModal(null);
          }}
          className="h-12 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors flex items-center gap-2"
        >
          <FileText size={14} />
          Ver Evidencias ({detalleModal.num_evidencias})
        </button>
        <button
          onClick={() => setDetalleModal(null)}
          className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

{editModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    onClick={(e) => e.target === e.currentTarget && setEditModal(null)}
  >
    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
      {/* HEADER */}
      <div className="bg-slate-900 p-8 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
        <div className="relative z-10">
          <span className="bg-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
            <Clock size={11} />
            Editando movimiento pendiente
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tighter mt-3">
            Movimiento <span className="text-amber-500">#{editModal.id}</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
            {editModal.tipo} · ${fmt(editModal.monto)}
          </p>
        </div>
        <button
          onClick={() => setEditModal(null)}
          className="relative z-10 bg-white/10 hover:bg-red-600 p-2.5 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* CUERPO SCROLLEABLE */}
      <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-slate-50/30">

        {/* SECCIÓN: CUENTA BANCARIA (destacada, requisito para confirmar) */}
        <div
          className={`rounded-2xl p-5 border-2 transition-colors ${
            editForm.cuenta_id
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-amber-50 border-amber-300"
          }`}
        >
          <label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 mb-2 text-slate-700">
            <Wallet size={13} />
            Cuenta Bancaria *
          </label>
          <select
            value={editForm.cuenta_id}
            onChange={(e) =>
              setEditForm({ ...editForm, cuenta_id: e.target.value })
            }
            className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Sin asignar</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.banco}
              </option>
            ))}
          </select>
          {!editForm.cuenta_id ? (
            <p className="text-[9px] font-black text-amber-700 uppercase mt-2 ml-1 flex items-center gap-1.5">
              ⚠ Debes asignar una cuenta antes de poder confirmar este movimiento
            </p>
          ) : (
            <p className="text-[9px] font-black text-emerald-700 uppercase mt-2 ml-1 flex items-center gap-1.5">
              ✓ Listo para confirmarse
            </p>
          )}
        </div>

        {/* SECCIÓN: DATOS GENERALES */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Datos Generales
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
<div className="space-y-1">
  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
    Monto *
  </label>
  <div className="relative">
    <DollarSign
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <Input
      type="number"
      value={editForm.monto}
      disabled={!!editModal.remesa_id}
      onChange={(e) =>
        setEditForm({ ...editForm, monto: e.target.value })
      }
      className="h-12 pl-9 rounded-xl border-slate-100 bg-slate-50 font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    />
  </div>
  {editModal.remesa_id && (
    <p className="text-[9px] font-bold text-slate-400 uppercase ml-1">
      🔒 Monto fijado por la Remesa HGZ.{editModal.remesa_folio} — no editable
    </p>
  )}
</div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Fecha *
                </label>
                <Input
                  type="date"
                  value={editForm.fecha_movimiento}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      fecha_movimiento: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Concepto
              </label>
              <Input
                value={editForm.concepto}
                onChange={(e) =>
                  setEditForm({ ...editForm, concepto: e.target.value })
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
                  value={editForm.categoria_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, categoria_id: e.target.value })
                  }
                  className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Proveedor
                </label>
                <select
                  value={editForm.proveedor_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, proveedor_id: e.target.value })
                  }
                  className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: FACTURACIÓN Y PAGO */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Facturación y Forma de Pago
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Forma de Pago
                </label>
                <select
                  value={editForm.forma_pago}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      forma_pago: e.target.value as "" | "contado" | "credito",
                      num_cuotas: "",
                      cuotas_indefinidas: false,
                    })
                  }
                  className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none"
                >
                  <option value="">Sin especificar</option>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              {editForm.forma_pago === "credito" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Número de Cuotas
                  </label>
                  <Input
                    type="number"
                    placeholder="Ej: 6"
                    value={editForm.num_cuotas}
                    disabled={editForm.cuotas_indefinidas}
                    onChange={(e) =>
                      setEditForm({ ...editForm, num_cuotas: e.target.value })
                    }
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs disabled:opacity-40"
                  />
                  <label className="flex items-center gap-2 mt-1.5 ml-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.cuotas_indefinidas}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          cuotas_indefinidas: e.target.checked,
                          num_cuotas: "",
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-[9px] font-black uppercase text-slate-400">
                      Cuotas indefinidas
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN: COMISIÓN */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Comisión Bancaria
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div
            className={`rounded-2xl p-5 border transition-colors ${
              editForm.tiene_comision
                ? "bg-white border-slate-100 shadow-sm"
                : "bg-slate-50/50 border-slate-100"
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.tiene_comision}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    tiene_comision: e.target.checked,
                    monto_comision: "",
                  })
                }
                className="rounded"
              />
              <span className="text-[10px] font-black uppercase text-slate-600">
                Esta transacción tiene comisión bancaria
              </span>
            </label>

            {editForm.tiene_comision && (
              <div className="space-y-1 mt-4">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Monto de la Comisión
                </label>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editForm.monto_comision}
                    onChange={(e) =>
                      setEditForm({ ...editForm, monto_comision: e.target.value })
                    }
                    className="h-12 pl-9 rounded-xl border-slate-100 bg-slate-50 font-black text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN: OBSERVACIONES */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Observaciones
            </h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <textarea
            value={editForm.observaciones}
            onChange={(e) =>
              setEditForm({ ...editForm, observaciones: e.target.value })
            }
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 font-bold text-xs resize-none outline-none focus:ring-2 focus:ring-amber-500/10 shadow-sm"
          />
        </div>
      </div>

      {/* FOOTER FIJO */}
      <div className="p-8 border-t border-slate-100 flex gap-4 justify-end items-center shrink-0 bg-white">
        <button
          onClick={() => setEditModal(null)}
          className="font-black text-[10px] uppercase text-slate-400 tracking-widest px-6 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardarEdicion}
          disabled={saving}
          className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-amber-500 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}