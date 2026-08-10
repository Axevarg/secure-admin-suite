import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Search,
  Send,
  Info,
  Calendar,
  Hash,
  User,
  Layers,
} from "lucide-react";

interface Requisicion {
  id: number;
  folio: string;
  partida: string;
  solicitante: string;
  estado: string;
  created_at: string;
  motivo_rechazo?: string;
}

interface Insumo {
  id: number;
  clave: string;
  descripcion: string;
  unidad: string;
  disponible: number;
  categoria_id: number;
  categoria: string; // "Materiales" | "Mano de Obra" | "Herramienta" | "Equipo"
}

interface IndirectoCatalogo {
  id: number;
  nombre: string;
  unidad: string | null;
  costo_unitario: number;
}

type Tipo = "insumo" | "indirecto";

interface DetalleNuevo {
  tipo: Tipo;
  item_id: number | null;
  cantidad: number;
  fecha_requerida: string;
}

const FILA_VACIA: DetalleNuevo = {
  tipo: "insumo",
  item_id: null,
  cantidad: 1,
  fecha_requerida: "",
};

// Orden fijo de categorías (independiente de cómo vengan de la BD)
const ORDEN_CATEGORIAS = ["Materiales", "Mano de Obra", "Herramienta", "Equipo"];
const CATEGORIA_INDIRECTOS = "Indirectos";

const estadoStyle: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-500 border-slate-200",
  enviada: "bg-amber-50 text-amber-700 border-amber-100",
  aprobada: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rechazada: "bg-red-50 text-red-700 border-red-100",
  entregada: "bg-blue-50 text-blue-700 border-blue-100",
};

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n || 0);

interface OpcionSelector {
  id: number;
  label: string;
  sublabel?: string;
}

// Dropdown con buscador propio (reemplaza el <select> nativo, que se vuelve
// inmanejable cuando el catálogo tiene decenas/cientos de items)
function ItemSelector({
  value,
  displayLabel,
  placeholder,
  options,
  onSelect,
}: {
  value: number | null;
  displayLabel: string;
  placeholder: string;
  options: OpcionSelector[];
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtradas = options.filter((o) => {
    const q = query.toLowerCase();
    return (
      !q ||
      o.label.toLowerCase().includes(q) ||
      o.sublabel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative group" ref={ref}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-12 pl-4 pr-10 border border-slate-100 bg-slate-50/50 rounded-xl font-black text-[11px] uppercase tracking-tight text-slate-700 text-left truncate focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600/20 transition-all cursor-pointer shadow-sm"
      >
        {displayLabel || (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-red-600 transition-colors">
        <Layers size={14} />
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[320px] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="BUSCAR..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtradas.length === 0 && (
              <p className="p-4 text-[9px] font-black uppercase text-slate-300 text-center tracking-widest">
                Sin resultados
              </p>
            )}
            {filtradas.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-slate-50 ${
                  o.id === value ? "bg-red-50" : ""
                }`}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-tight ${
                    o.id === value ? "text-red-600" : "text-slate-700"
                  }`}
                >
                  {o.label}
                </p>
                {o.sublabel && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                    {o.sublabel}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequisicionesPage() {
  const { id } = useParams();
  const [reqs, setReqs] = useState<Requisicion[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [indirectos, setIndirectos] = useState<IndirectoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [reqEditId, setReqEditId] = useState<number | null>(null);
  const [partida, setPartida] = useState("");
  const [notas, setNotas] = useState("");
  const [detalles, setDetalles] = useState<DetalleNuevo[]>([{ ...FILA_VACIA }]);
  const [globalSearch, setGlobalSearch] = useState(""); // Buscador de la tabla
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);

  // ⭐ categoría activa dentro del modal (aplica a todas las filas)
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Materiales");

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, stock, ind] = await Promise.all([
        api.get(`/requisiciones/obra/${id}`),
        api.get(`/stock/obra/${id}`),
        api.get(`/indirectos/obra/${id}`),
      ]);
      setReqs(Array.isArray(r.data) ? r.data : []);
      setInsumos(stock.data ?? []);
      setIndirectos(ind.data?.items ?? []);
    } catch {
      console.error("Error al sincronizar con SIGO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const filteredReqs = reqs.filter((r) => {
    const s = globalSearch.toLowerCase();

    return (
      (r.folio?.toLowerCase() || "").includes(s) ||
      (r.partida?.toLowerCase() || "").includes(s) ||
      (r.solicitante?.toLowerCase() || "").includes(s)
    );
  });

  // ⭐ categorías realmente presentes en el catálogo de la obra,
  // respetando el orden fijo, agregando cualquier categoría extra al final,
  // y siempre incluyendo Indirectos.
  const categoriasDisponibles = [
    ...ORDEN_CATEGORIAS.filter((c) =>
      insumos.some((i) => i.categoria === c)
    ),
    ...Array.from(new Set(insumos.map((i) => i.categoria))).filter(
      (c) => c && !ORDEN_CATEGORIAS.includes(c)
    ),
    CATEGORIA_INDIRECTOS,
  ];

  const abrirCrear = () => {
    setModoEditar(false);
    setReqEditId(null);
    setPartida("");
    setNotas("");
    setDetalles([{ ...FILA_VACIA }]);
    setCategoriaActiva("Materiales");
    setShowModal(true);
  };

  const abrirEditar = async (req: Requisicion) => {
    try {
      const res = await api.get(`/requisiciones/${req.id}`);
      const { requisicion, detalles: dets } = res.data;
      setMotivoRechazo(req.motivo_rechazo ?? null);
      setModoEditar(true);
      setReqEditId(req.id);
      setPartida(requisicion.partida);
      setDetalles(
        dets.map((d: any) => {
          const tipo: Tipo = d.tipo === "indirecto" ? "indirecto" : "insumo";
          const item_id =
            tipo === "indirecto"
              ? d.indirecto_id ??
                indirectos.find((x) => x.nombre === d.descripcion)?.id ??
                null
              : d.insumo_id ??
                insumos.find((i) => i.descripcion === d.descripcion)?.id ??
                null;

          return {
            tipo,
            item_id,
            cantidad: d.cantidad,
            fecha_requerida: d.fecha_requerida?.slice(0, 10) ?? "",
          };
        })
      );
      setCategoriaActiva("Materiales");
      setShowModal(true);
    } catch {
      alert("Error cargando detalle");
    }
  };

  const addRow = () => setDetalles((prev) => [...prev, { ...FILA_VACIA }]);
  const removeRow = (i: number) =>
    setDetalles((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)
    );
  const updateRow = (i: number, field: keyof DetalleNuevo, value: any) =>
    setDetalles((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });

  // Selecciona un item (insumo o indirecto) en una fila, fijando tipo + id juntos
  const seleccionarItem = (i: number, itemId: number, tipo: Tipo) =>
    setDetalles((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], item_id: itemId, tipo };
      return copy;
    });

  const guardar = async () => {
    if (!partida.trim()) return alert("La partida es obligatoria");
    const filasValidas = detalles.filter((d) => d.item_id !== null);
    if (filasValidas.length === 0) return alert("Agrega al menos un insumo");

    try {
      if (modoEditar && reqEditId) {
        await api.put(`/requisiciones/${reqEditId}`, {
          partida,
          detalles: filasValidas,
        });
      } else {
        await api.post(`/requisiciones/obra/${id}`, {
          partida,
          notas,
          detalles: filasValidas,
        });
      }
      cerrarModal();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Error guardando");
    }
  };

  const enviar = async (reqId: number) => {
    if (!confirm("¿Enviar requisición? Esta acción bloqueará la edición."))
      return;
    try {
      await api.put(`/requisiciones/${reqId}/estado`, { estado: "enviada" });
      loadData();
    } catch {
      alert("Error enviando requisición");
    }
  };

  const insumoIdsSeleccionados = detalles
    .filter((d) => d.tipo === "insumo")
    .map((d) => d.item_id)
    .filter(Boolean);

  const indirectoIdsSeleccionados = detalles
    .filter((d) => d.tipo === "indirecto")
    .map((d) => d.item_id)
    .filter(Boolean);

  const cerrarModal = () => {
    setMotivoRechazo(null);
    setShowModal(false);
    setModoEditar(false);
    setDetalles([{ ...FILA_VACIA }]);
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Sincronizando Requisiciones SIGO...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SIGO STYLE */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
        <div className="absolute right-0 top-0 w-40 h-40 bg-red-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <ClipboardList
                size={22}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Requisiciones
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            Gestión de suministros por obra
          </p>
        </div>
        <Button
          onClick={abrirCrear}
          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-[0.15em] h-12 px-8 rounded-2xl transition-all shadow-xl shadow-red-900/20 border-none relative z-10"
        >
          <Plus size={16} strokeWidth={3} className="mr-2" /> Nueva Requisición
        </Button>
      </div>

      {/* BARRA DE BÚSQUEDA GLOBAL */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={20} />
        <Input
          placeholder="BUSCAR POR FOLIO, PARTIDA O SOLICITANTE..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="h-16 pl-14 bg-white border-slate-100 rounded-[1.5rem] shadow-sm font-black text-xs tracking-widest uppercase focus-visible:ring-red-600/10 focus-visible:border-red-600/20 transition-all"
        />
      </div>

      {/* TABLA DE REQUISICIONES */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="font-black text-[10px] uppercase pl-8 py-5 text-left tracking-widest text-slate-400">
                  Folio / Partida
                </th>
                <th className="font-black text-[10px] uppercase py-5 text-left tracking-widest text-slate-400">
                  Solicitante
                </th>
                <th className="font-black text-[10px] uppercase py-5 text-left tracking-widest text-slate-400 text-center">
                  Estado
                </th>
                <th className="font-black text-[10px] uppercase py-5 text-right tracking-widest text-slate-400 pr-8">
                  Gestión
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReqs.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  <td className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-900 font-black text-sm uppercase">
                        {r.folio}
                      </div>
                      <div className="h-1 w-1 bg-slate-300 rounded-full" />
                      <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wide">
                        {r.partida}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-300">
                      <Calendar size={10} />
                      <span className="text-[9px] font-bold uppercase">
                        {new Date(r.created_at).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 uppercase font-black text-[9px]">
                        {r.solicitante.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                        {r.solicitante}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          estadoStyle[r.estado] ??
                          "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {r.estado ?? "borrador"}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 pr-8 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {(r.estado === "borrador" ||
                        r.estado === "rechazada" ||
                        !r.estado) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEditar(r)}
                            className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest border-slate-200 hover:bg-slate-900 hover:text-white transition-all gap-2 px-4"
                          >
                            <Pencil size={12} strokeWidth={3} /> Editar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => enviar(r.id)}
                            className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2 px-4"
                          >
                            <Send size={12} strokeWidth={3} />
                            {r.estado === "rechazada" ? "Re-enviar" : "Enviar"}
                          </Button>
                        </>
                      )}
                      {r.estado && r.estado !== "borrador" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            (window.location.href = `/requisiciones/${r.id}`)
                          }
                          className="h-9 rounded-xl font-black text-[9px] uppercase tracking-widest border-slate-100 text-slate-400  transition-all px-4"
                        >
                          Inspeccionar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReqs.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300">
            <Info size={32} className="mb-2 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-widest opacity-40 text-slate-500">
              {globalSearch ? "No se encontraron coincidencias" : "Sin historial de requisiciones"}
            </p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
<div
  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
  style={{
    marginTop: "0px",
  }}
>
          <div className="bg-white rounded-[1rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-10 text-white relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                    <Layers size={24} className="text-red-600" />
                    {modoEditar
                      ? "Modificar Requisición"
                      : "Nueva Requisición de Insumos"}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2 ml-1">
                    Configuración técnica de solicitud
                  </p>
                </div>
                <button
                  onClick={cerrarModal}
                  className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {modoEditar && motivoRechazo && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="bg-red-100 p-2 rounded-xl shrink-0">
                    <Info size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">
                      Motivo de Rechazo
                    </p>
                    <p className="text-xs font-bold text-red-500 leading-relaxed">
                      {motivoRechazo}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <Hash size={12} /> Partida de Obra *
                  </label>
                  <Input
                    placeholder="EJ. ESTRUCTURA METÁLICA, CANCELERÍA..."
                    value={partida}
                    onChange={(e) => setPartida(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-xs uppercase focus-visible:ring-red-600/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <User size={12} /> Notas Internas
                  </label>
                  <Input
                    placeholder="OBSERVACIONES PARA COMPRAS..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-xs focus-visible:ring-red-600/10 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                    Listado de Insumos Requeridos
                  </h3>
                  <div className="h-px flex-1 bg-slate-50 mx-4" />
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    Cada renglón trae su propio buscador
                  </p>
                </div>

                {/* TABS DE CATEGORÍA */}
                <div className="flex flex-wrap gap-2 px-2">
                  {categoriasDisponibles.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaActiva(cat)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        categoriaActiva === cat
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {categoriaActiva === CATEGORIA_INDIRECTOS &&
                  indirectos.length === 0 && (
                    <div className="mx-2 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wide">
                        Aún no hay conceptos capturados en Indirectos. Agrega
                        alguno primero desde esa pestaña (tintas, escobas,
                        trapos, etc.) para poder solicitarlo aquí.
                      </p>
                    </div>
                  )}

                <div className="bg-white border border-slate-100 rounded-[2rem] overflow-visible">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100 rounded-t-[2rem]">
                      <tr>
                        <th className="font-black text-[9px] uppercase text-left p-4 tracking-widest text-slate-400 rounded-tl-[2rem]">
                          Insumo / Unidad
                        </th>
                        <th className="font-black text-[9px] uppercase text-center p-4 tracking-widest text-slate-400 w-32">
                          Cant.
                        </th>
                        <th className="font-black text-[9px] uppercase text-left p-4 tracking-widest text-slate-400 w-48">
                          Fecha de Entrega
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {detalles.map((d, i) => {
                        // Info normalizada del item ya seleccionado en esta fila,
                        // sin importar si es insumo o indirecto ni la categoría activa
                        const insumoDeLaFila =
                          d.tipo === "insumo"
                            ? insumos.find((ins) => ins.id === d.item_id)
                            : undefined;
                        const indirectoDeLaFila =
                          d.tipo === "indirecto"
                            ? indirectos.find((ind) => ind.id === d.item_id)
                            : undefined;

                        const esOtraCategoria =
                          (insumoDeLaFila &&
                            insumoDeLaFila.categoria !== categoriaActiva) ||
                          (indirectoDeLaFila &&
                            categoriaActiva !== CATEGORIA_INDIRECTOS);

                        // Opciones que se muestran en el buscador de esta fila
                        const opciones: OpcionSelector[] =
                          categoriaActiva === CATEGORIA_INDIRECTOS
                            ? [
                                ...(esOtraCategoria && indirectoDeLaFila
                                  ? [
                                      {
                                        id: indirectoDeLaFila.id,
                                        label: `${indirectoDeLaFila.nombre.toUpperCase()} — INDIRECTOS`,
                                        sublabel: indirectoDeLaFila.unidad || "—",
                                      },
                                    ]
                                  : []),
                                ...indirectos
                                  .filter(
                                    (ind) =>
                                      !indirectoIdsSeleccionados.includes(ind.id) ||
                                      (d.tipo === "indirecto" && ind.id === d.item_id)
                                  )
                                  .map((ind) => ({
                                    id: ind.id,
                                    label: ind.nombre.toUpperCase(),
                                    sublabel: `${ind.unidad || "—"} • Costo ref: ${money(ind.costo_unitario)}`,
                                  })),
                              ]
                            : [
                                ...(esOtraCategoria && insumoDeLaFila
                                  ? [
                                      {
                                        id: insumoDeLaFila.id,
                                        label: `${insumoDeLaFila.clave} • ${insumoDeLaFila.descripcion.toUpperCase()} — ${insumoDeLaFila.categoria.toUpperCase()}`,
                                        sublabel: insumoDeLaFila.unidad,
                                      },
                                    ]
                                  : []),
                                ...insumos
                                  .filter((ins) => ins.categoria === categoriaActiva)
                                  .filter(
                                    (ins) =>
                                      !insumoIdsSeleccionados.includes(ins.id) ||
                                      (d.tipo === "insumo" && ins.id === d.item_id)
                                  )
                                  .map((ins) => ({
                                    id: ins.id,
                                    label: `${ins.clave} • ${ins.descripcion.toUpperCase()}`,
                                    sublabel: `${ins.unidad} • Disp: ${ins.disponible}`,
                                  })),
                              ];

                        const displayLabel = insumoDeLaFila
                          ? `${insumoDeLaFila.clave} • ${insumoDeLaFila.descripcion.toUpperCase()}`
                          : indirectoDeLaFila
                            ? indirectoDeLaFila.nombre.toUpperCase()
                            : "";

                        return (
                          <tr key={i}>
                            <td className="p-3 pl-4">
                              <ItemSelector
                                value={d.item_id}
                                displayLabel={displayLabel}
                                placeholder={`SELECCIONAR (${categoriaActiva.toUpperCase()})`}
                                options={opciones}
                                onSelect={(val) => {
                                  const tipo: Tipo =
                                    categoriaActiva === CATEGORIA_INDIRECTOS
                                      ? "indirecto"
                                      : "insumo";
                                  seleccionarItem(i, val, tipo);
                                }}
                              />
                              {(insumoDeLaFila || indirectoDeLaFila) && (
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1 ml-1">
                                  {insumoDeLaFila
                                    ? insumoDeLaFila.categoria
                                    : "Indirectos"}
                                </p>
                              )}
                            </td>

                            <td className="p-3">
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={d.cantidad}
                                  onChange={(e) => {
                                    const cantidad = Number(e.target.value);
                                    if (d.tipo === "insumo") {
                                      const insumo = insumos.find(
                                        (ins) => ins.id === d.item_id
                                      );
                                      if (insumo && cantidad > insumo.disponible) {
                                        alert(`Stock insuficiente. Disponible: ${insumo.disponible}`);
                                        return;
                                      }
                                    }
                                    updateRow(i, "cantidad", cantidad);
                                  }}
                                  className="h-12 w-28 mx-auto rounded-xl border-slate-100 bg-white font-black text-center text-sm shadow-sm focus-visible:ring-red-600/10 focus-visible:border-red-600/20"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <Input
                                type="date"
                                value={d.fecha_requerida}
                                onChange={(e) =>
                                  updateRow(i, "fecha_requerida", e.target.value)
                                }
                                className="h-10 rounded-xl border-slate-100 font-bold text-[10px] uppercase"
                              />
                            </td>
                            <td className="p-3 pr-4">
                              <button
                                onClick={() => removeRow(i)}
                                className="text-slate-200 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={addRow}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors ml-4 pt-2"
                >
                  <Plus size={14} strokeWidth={3} /> Expandir Listado
                </button>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 justify-end items-center shrink-0">
              <button
                onClick={cerrarModal}
                className="font-black text-[10px] uppercase text-slate-400 tracking-widest px-4"
              >
                Cancelar
              </button>
              <Button
                onClick={guardar}
                className="bg-slate-900 hover:bg-red-600 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-14 shadow-2xl transition-all border-none"
              >
                {modoEditar
                  ? "Confirmar Cambios"
                  : `Generar Requisición SIGO (${detalles.filter((d) => d.item_id).length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}