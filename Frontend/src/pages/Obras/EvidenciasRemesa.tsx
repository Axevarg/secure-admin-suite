import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input"; // <--- VERIFICA ESTA RUTA
import {
  FileUp,
  X,
  Construction,
  User,
  Paperclip,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

// --- TIPOS ---
type Remesa = {
  id: number;
  folio: string;
  monto: number;
  estado: string;
  obra_nombre: string;
  elaboro_nombre: string;
};

type Evidencia = {
  id: number;
  nombre_archivo: string;
  url: string;
  tipo: string;
  usuario: string;
};

type FilePreview = {
  file: File;
  preview: string;
  tipo: "foto" | "pdf";
};

// ─── MODAL REDISEÑADO SIGO ───────────────────────────────────────────────────
function EvidenciasModal({
  remesa,
  evidencias,
  onClose,
  onUploaded,
  onEliminar,
}: {
  remesa: Remesa;
  evidencias: Evidencia[];
  onClose: () => void;
  onUploaded: () => void;
  onEliminar: (id: number) => void;
}) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

  const puedeSubir =
    remesa.estado === "aprobado" || remesa.estado === "recibida";

  const addFiles = (newFiles: File[]) => {
    const previews: FilePreview[] = newFiles.map((file) => ({
      file,
      preview: file.type.includes("pdf") ? "" : URL.createObjectURL(file),
      tipo: file.type.includes("pdf") ? "pdf" : "foto",
    }));
    setFiles((prev) => [...prev, ...previews]);
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
      form.append("remesa_id", remesa.id.toString());
      files.forEach((f) => form.append("files", f.file));
      await api.post("/evidencias/remesa/upload", form);
      setFiles([]);
      onUploaded();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"   style={{
    marginTop: "0px",
  }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER MODAL */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Remesa Digital
              </span>
              <span className="text-slate-400 font-mono text-sm">
                #{remesa.folio}
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">
              Gestión de <span className="text-red-500">Evidencias</span>
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1 flex items-center gap-2">
              <Construction size={14} className="text-red-600" />{" "}
              {remesa.obra_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-8">
          {/* ZONA DROP SIGO */}
          {puedeSubir && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`group border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 hover:border-red-600 hover:bg-slate-50"
                }`}
              >
                <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition-colors">
                  <FileUp
                    className={dragging ? "text-red-600" : "text-slate-400"}
                    size={32}
                  />
                </div>
                <p className="text-slate-900 font-black uppercase tracking-tight text-sm">
                  Arrastra evidencias aquí
                </p>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">
                  Imágenes y PDFs · Máximo 20 archivos
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

              {/* PREVIEW ANTES DE SUBIR */}
              {files.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Cola de carga ({files.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {files.map((fp, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square border rounded-2xl overflow-hidden bg-white shadow-sm group"
                      >
                        {fp.tipo === "foto" ? (
                          <img
                            src={fp.preview}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-slate-100 text-red-600">
                            <FileText size={32} />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-6 w-full bg-red-600 hover:bg-slate-900 disabled:bg-slate-300 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-red-900/20"
                  >
                    {uploading
                      ? "Sincronizando..."
                      : `Confirmar Subida de ${files.length} Archivos`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* EVIDENCIAS GUARDADAS */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-red-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Expediente Guardado ({evidencias.length})
              </h3>
            </div>

            {evidencias.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <AlertCircle
                  className="mx-auto text-slate-300 mb-2"
                  size={40}
                />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
                  No hay registros fotográficos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {evidencias.map((ev) => (
                  <div
                    key={ev.id}
                    className="relative aspect-square border-2 border-slate-100 rounded-3xl overflow-hidden group hover:border-red-600 transition-all bg-white shadow-sm"
                  >
                    {ev.tipo === "foto" ? (
                      <img
                        src={`${BASE_URL}${ev.url}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <a
                        href={`${BASE_URL}${ev.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FileText size={40} />
                      </a>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[8px] text-white font-bold truncate">
                        {ev.nombre_archivo}
                      </p>
                    </div>

                    {puedeSubir && (
                      <button
                        onClick={() => onEliminar(ev.id)}
                        className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-lg p-2 transition-all backdrop-blur-md translate-y-[-10px] group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
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

// ─── PÁGINA PRINCIPAL SIGO ────────────────────────────────────────────────────
export default function EvidenciasObraPage() {
  const { id } = useParams();
  const obraId = Number(id);

  const [remesas, setRemesas] = useState<Remesa[]>([]);
  const [evidencias, setEvidencias] = useState<Record<number, Evidencia[]>>({});
  const [modalRemesa, setModalRemesa] = useState<Remesa | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // <--- ESTO FALTA

  const loadRemesas = async () => {
    const res = await api.get(`/evidencias/obra/${obraId}`);
    setRemesas(res.data);
    res.data.forEach((r: Remesa) => loadEvidencias(r.id));
  };

  const loadEvidencias = async (remesaId: number) => {
    const res = await api.get(`/evidencias/remesa/${remesaId}`);
    setEvidencias((prev) => ({ ...prev, [remesaId]: res.data }));
  };

  const eliminar = async (evidenciaId: number, remesaId: number) => {
    await api.delete(`/evidencias/${evidenciaId}`);
    loadEvidencias(remesaId);
  };

  useEffect(() => {
    if (!obraId) return;
    loadRemesas();
  }, [obraId]);

  const getStatusConfig = (estado: string) => {
    const configs: Record<string, any> = {
      recibida: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle2 size={12} />,
        label: "Completado",
      },
      aprobado: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <Clock size={12} />,
        label: "Vigente",
      },
      pendiente: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <AlertCircle size={12} />,
        label: "Revision",
      },
    };
    return (
      configs[estado] || {
        bg: "bg-slate-100",
        text: "text-slate-600",
        icon: null,
        label: estado,
      }
    );
  };

  const puedeSubir = (estado: string) =>
    estado === "aprobado" || estado === "recibida";

  // Justo antes del return del componente, después de puedeSubir:
const remesasFiltradas = remesas.filter((r) => {
  const term = searchTerm.toLowerCase();
  return (
    String(r.folio).toLowerCase().includes(term) ||   // ← String()
    r.estado.toLowerCase().includes(term) ||
    (r.elaboro_nombre ?? "").toLowerCase().includes(term) ||
    (r.obra_nombre ?? "").toLowerCase().includes(term)
  );
});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* BANNER DE TÍTULO SIGO */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
        {/* Efecto de fondo (Blur) */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <Paperclip size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
              Expediente de <span className="text-red-600">Remesas</span>
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            ID OBRA: #{obraId} — Control de Evidencias Digitales
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Badge de Resumen rápido opcional */}
          <div className="flex-1 sm:flex-none bg-slate-900 text-white font-black uppercase text-[10px] h-11 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20">
            <Construction size={16} className="text-red-500" strokeWidth={3} />
            {remesas.length} Remesas Totales
          </div>
        </div>
      </div>

      {/* BUSCADOR DE REMESAS */}
      <div className="relative group">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
          size={20}
        />
        <Input
          placeholder="FILTRAR POR FOLIO, ESTADO O RESPONSABLE DE REMESA..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-slate-100 rounded-2xl pl-14 h-16 font-bold text-xs uppercase tracking-widest shadow-sm focus-visible:ring-red-600/20 transition-all border-b-4 border-b-slate-100 focus:border-b-red-600"
        />
      </div>

      {/* GRID DE REMESAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {remesasFiltradas.map((remesa) => {
          const evs = evidencias[remesa.id] ?? [];
          const config = getStatusConfig(remesa.estado);

          return (
            <div
              key={remesa.id}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group overflow-hidden relative"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-5 flex-1">
                  {/* ENCABEZADO DE TARJETA */}
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-900 group-hover:bg-red-600 group-hover:text-white transition-colors mt-1">
                      <FileText size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-xl text-slate-900 uppercase tracking-tighter italic leading-none">
                          Folio {remesa.folio}
                        </h2>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}
                        >
                          {config.icon} {config.label}
                        </div>
                      </div>

                      {/* NOMBRE DE LA OBRA - DESTACADO */}
                      <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                        <Construction size={12} className="text-red-600" />
                        <p className="text-[10px] font-black uppercase text-slate-600 tracking-tight">
                          {remesa.obra_nombre}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INFO ADICIONAL */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">
                          Responsable
                        </p>
                        <p className="text-xs font-bold text-slate-700 truncate uppercase">
                          {remesa.elaboro_nombre ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <ImageIcon size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">
                          Archivos
                        </p>
                        <p className="text-xs font-black text-red-600 uppercase">
                          {evs.length} Evidencia{evs.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCIÓN */}
                <div className="flex flex-col items-end justify-center h-full self-center">
                  <button
                    onClick={() => setModalRemesa(remesa)}
                    className={`p-4 rounded-2xl transition-all shadow-lg flex items-center gap-3 border-b-4 active:border-b-0 active:translate-y-1 ${
                      puedeSubir(remesa.estado)
                        ? "bg-slate-900 text-white hover:bg-red-600 border-slate-700 hover:border-red-800 shadow-slate-900/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                    }`}
                  >
                    {puedeSubir(remesa.estado) ? (
                      <>
                        <span className="font-black text-[10px] uppercase tracking-widest pl-2">
                          Gestionar
                        </span>
                        <Paperclip size={18} />
                      </>
                    ) : (
                      <>
                        <span className="font-black text-[10px] uppercase tracking-widest pl-2">
                          Visualizar
                        </span>
                        <Eye size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalRemesa && (
        <EvidenciasModal
          remesa={modalRemesa}
          evidencias={evidencias[modalRemesa.id] ?? []}
          onClose={() => setModalRemesa(null)}
          onUploaded={() => loadEvidencias(modalRemesa.id)}
          onEliminar={(evId) => eliminar(evId, modalRemesa.id)}
        />
      )}
    </div>
  );
}
