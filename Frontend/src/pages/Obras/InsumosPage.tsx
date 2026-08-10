import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";

import {
  UploadCloud,
  Package,
  Hammer,
  Wrench,
  Truck,
  RefreshCcw,
  LayoutGrid,
  Info,
  Search,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Trash2,
  PiggyBank, Loader2, Save, Plus
} from "lucide-react";

interface Insumo {
  id: number;
  categoria: string;
  categoria_id: number; // asegúrate de tenerlo si no lo tenías
  clave: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  costo_unitario: number;
  importe: number;
  cantidad_pedida: number;
  es_extraordinario?: boolean;
}

interface TotalCategoria {
  categoria_id: number;
  categoria: string;
  total: number;
}

interface IndirectoItem {
  id: number;
  obra_id: number;
  nombre: string;
  unidad: string | null;
  cantidad: number;
  costo_unitario: number;
  importe: number;
  created_at: string;
}

const categorias = [
  {
    name: "Materiales",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "Mano de Obra",
    icon: Hammer,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    name: "Herramienta",
    icon: Wrench,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  { name: "Equipo", icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
];

export default function InsumosPage() {
  const { id } = useParams();
  const obra = JSON.parse(localStorage.getItem("activeObra") || "null");

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [totales, setTotales] = useState<TotalCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Materiales");
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // INVENTARIO EXTRA
  const [openInventario, setOpenInventario] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(
    null,
  );
  const [cantidadInv, setCantidadInv] = useState("");
  const [motivoInv, setMotivoInv] = useState("");
  const [guardandoInv, setGuardandoInv] = useState(false);

  // INDIRECTOS
  const [presupuestoIndirectos, setPresupuestoIndirectos] = useState(0);
  const [indirectosItems, setIndirectosItems] = useState<IndirectoItem[]>([]);
  const [totalGastadoIndirectos, setTotalGastadoIndirectos] = useState(0);
  const [porcentajeIndirectos, setPorcentajeIndirectos] = useState(0);

  const [openInsumoExtra, setOpenInsumoExtra] = useState(false);
  const [categoriaExtra, setCategoriaExtra] = useState("1"); // categoria_id como string para el select
  const [claveExtra, setClaveExtra] = useState("");
  const [descripcionExtra, setDescripcionExtra] = useState("");
  const [unidadExtra, setUnidadExtra] = useState("");
  const [cantidadExtra, setCantidadExtra] = useState("");
  const [costoExtra, setCostoExtra] = useState("");
  const [motivoExtra, setMotivoExtra] = useState("");
  const [guardandoExtra, setGuardandoExtra] = useState(false);

  const [openPresupuesto, setOpenPresupuesto] = useState(false);
  const [presupuestoInput, setPresupuestoInput] = useState("");
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false);

  const [openNuevoIndirecto, setOpenNuevoIndirecto] = useState(false);
  const [nombreInd, setNombreInd] = useState("");
  const [unidadInd, setUnidadInd] = useState("");
  const [cantidadInd, setCantidadInd] = useState("");
  const [costoInd, setCostoInd] = useState("");
  const [guardandoIndirecto, setGuardandoIndirecto] = useState(false);

  const loadInsumos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/insumos/obra/${id}`);
      setInsumos(res.data.insumos ?? []);
      setTotales(res.data.totales ?? []);
    } catch (err) {
      console.error("Error cargando insumos", err);
    } finally {
      setLoading(false);
    }
  };
  const guardarInsumoExtra = async () => {
    if (!descripcionExtra.trim())
      return alert("Escribe la descripción del material");
    if (!cantidadExtra || Number(cantidadExtra) <= 0)
      return alert("Cantidad inválida");
    if (!costoExtra || Number(costoExtra) < 0)
      return alert("Costo unitario inválido");
    if (motivoExtra.trim().length < 10)
      return alert("La justificación debe tener mínimo 10 caracteres");

    try {
      setGuardandoExtra(true);
      await api.post("/insumos/agregar", {
        obra_id: id,
        categoria_id: Number(categoriaExtra),
        clave: claveExtra,
        descripcion: descripcionExtra,
        unidad: unidadExtra,
        cantidad: Number(cantidadExtra),
        costo_unitario: Number(costoExtra),
        motivo: motivoExtra,
      });
      setOpenInsumoExtra(false);
      setClaveExtra("");
      setDescripcionExtra("");
      setUnidadExtra("");
      setCantidadExtra("");
      setCostoExtra("");
      setMotivoExtra("");
      loadInsumos();
    } catch (err) {
      alert("Error agregando el material extraordinario");
    } finally {
      setGuardandoExtra(false);
    }
  };

  const loadIndirectos = async () => {
    try {
      const res = await api.get(`/indirectos/obra/${id}`);
      setPresupuestoIndirectos(res.data.presupuesto ?? 0);
      setIndirectosItems(res.data.items ?? []);
      setTotalGastadoIndirectos(res.data.total_gastado ?? 0);
      setPorcentajeIndirectos(res.data.porcentaje ?? 0);
    } catch (err) {
      console.error("Error cargando indirectos", err);
    }
  };

  const abrirModalInventario = (insumo: Insumo) => {
    setInsumoSeleccionado(insumo);
    setCantidadInv("");
    setMotivoInv("");
    setOpenInventario(true);
  };

  const guardarInventario = async () => {
    if (!cantidadInv || Number(cantidadInv) <= 0) {
      alert("Ingresa una cantidad válida");
      return;
    }

    if (motivoInv.trim().length < 10) {
      alert("La justificación debe tener mínimo 10 caracteres");
      return;
    }

    try {
      setGuardandoInv(true);

      await api.post("/insumos/inventario/agregar", {
        obra_id: id,
        insumo_id: insumoSeleccionado?.id,
        cantidad: Number(cantidadInv),
        motivo: motivoInv,
      });

      setOpenInventario(false);
      loadInsumos(); // 🔥 refrescar tabla
    } catch (err) {
      alert("Error agregando inventario");
    } finally {
      setGuardandoInv(false);
    }
  };

  const guardarPresupuesto = async () => {
    if (!presupuestoInput || Number(presupuestoInput) < 0) {
      alert("Ingresa un presupuesto válido");
      return;
    }
    try {
      setGuardandoPresupuesto(true);
      await api.post("/indirectos/presupuesto", {
        obra_id: id,
        presupuesto: Number(presupuestoInput),
      });
      setOpenPresupuesto(false);
      loadIndirectos();
    } catch (err) {
      alert("Error guardando presupuesto");
    } finally {
      setGuardandoPresupuesto(false);
    }
  };

  const guardarIndirecto = async () => {
    if (!nombreInd.trim()) return alert("Escribe el nombre del concepto");
    if (!cantidadInd || Number(cantidadInd) <= 0)
      return alert("Cantidad inválida");
    if (!costoInd || Number(costoInd) < 0) return alert("Costo inválido");

    try {
      setGuardandoIndirecto(true);
      await api.post("/indirectos/agregar", {
        obra_id: id,
        nombre: nombreInd,
        unidad: unidadInd,
        cantidad: Number(cantidadInd),
        costo_unitario: Number(costoInd),
      });
      setOpenNuevoIndirecto(false);
      setNombreInd("");
      setUnidadInd("");
      setCantidadInd("");
      setCostoInd("");
      loadIndirectos();
    } catch (err) {
      alert("Error agregando el concepto");
    } finally {
      setGuardandoIndirecto(false);
    }
  };

  const eliminarIndirecto = async (itemId: number) => {
    if (!confirm("¿Eliminar este concepto?")) return;
    try {
      await api.delete(`/indirectos/${itemId}`);
      loadIndirectos();
    } catch (err) {
      alert("Error eliminando el concepto");
    }
  };

  useEffect(() => {
    if (id) {
      loadInsumos();
      loadIndirectos();
    }
  }, [id]);

  const importarExcel = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/insumos/importar/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      loadInsumos();
    } catch (err) {
      alert("Error importando archivo");
    } finally {
      setUploading(false);
    }
  };

  // LÓGICA DE FILTRADO OPTIMIZADA
  const filteredData = useMemo(() => {
    return insumos.filter((i) => {
      const matchesTab = i.categoria === activeTab;
      const matchesSearch =
        i.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.clave.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [insumos, activeTab, searchTerm]);

  const totalCategoriaActiva =
    totales.find((t) => t.categoria === activeTab)?.total ?? 0;

  const money = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(n || 0);

  const formatQty = (n: number) =>
    new Intl.NumberFormat("es-MX").format(n || 0);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Analizando Catálogo SIGO...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <LayoutGrid size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">
              Listado Insumos
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {obra?.nombre || "Explosión de Insumos"}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) =>
                e.target.files && importarExcel(e.target.files[0])
              }
            />
            <div className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] h-11 px-6 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
              <UploadCloud size={16} strokeWidth={3} />
              {uploading ? "SUBIENDO..." : "IMPORTAR EXCEL"}
            </div>
          </label>

          <Button
            onClick={() => setOpenInsumoExtra(true)}
            className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] h-11 px-6 rounded-xl shadow-lg shadow-amber-900/20"
          >
            + MATERIAL EXTRAORDINARIO
          </Button>
          <Button
            onClick={loadInsumos}
            variant="outline"
            className="flex-1 sm:flex-none border-slate-200 text-slate-500 font-black uppercase text-[10px] h-11 px-6 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCcw size={16} className="mr-2" strokeWidth={3} />
            ACTUALIZAR
          </Button>
        </div>
      </div>

      {/* RESUMEN DE TOTALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          const total =
            totales.find((t) => t.categoria === cat.name)?.total ?? 0;
          return (
            <div
              key={cat.name}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-red-100 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`${cat.bg} ${cat.color} p-3 rounded-2xl`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-200 group-hover:text-red-300 transition-colors"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">
                  {cat.name}
                </p>
                <p className="text-xl font-black text-slate-900">
                  {money(total)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* BUSCADOR */}
      <div className="relative group">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
          size={20}
        />
        <Input
          placeholder="FILTRAR POR CLAVE O DESCRIPCIÓN DEL INSUMO..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-slate-100 rounded-2xl pl-14 h-16 font-bold text-xs uppercase tracking-widest shadow-sm focus-visible:ring-red-600/20 transition-all"
        />
      </div>

      {/* TABS Y TABLA */}
      <div className="space-y-6">
        <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit overflow-x-auto max-w-full">
          {categorias.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setActiveTab(cat.name);
                setSearchTerm(""); // Opcional: Limpiar búsqueda al cambiar tab
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === cat.name
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            onClick={() => {
              setActiveTab("Indirectos");
              setSearchTerm("");
            }}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "Indirectos"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={14} strokeWidth={3} />
            Indirectos
          </button>
        </div>

        {activeTab === "Indirectos" ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            {/* PRESUPUESTO Y BARRA DE AVANCE */}
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2.5 rounded-xl">
                    <PiggyBank
                      size={18}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Presupuesto Indirectos
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {money(presupuestoIndirectos)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      setPresupuestoInput(String(presupuestoIndirectos || ""));
                      setOpenPresupuesto(true);
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-none border-slate-200 text-slate-500 font-black uppercase text-[10px] h-11 px-5 rounded-xl"
                  >
                    Definir presupuesto
                  </Button>
                  <Button
                    onClick={() => setOpenNuevoIndirecto(true)}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] h-11 px-5 rounded-xl"
                  >
                    + Agregar concepto
                  </Button>
                </div>
              </div>

              {/* Barra de avance */}
              <div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 transition-all duration-500 ${
                      porcentajeIndirectos >= 100
                        ? "bg-red-600"
                        : porcentajeIndirectos >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(porcentajeIndirectos, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase">
                    Gastado: {money(totalGastadoIndirectos)} (
                    {porcentajeIndirectos}%)
                  </p>
                  {porcentajeIndirectos >= 100 && (
                    <p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1">
                      <AlertTriangle size={12} /> Presupuesto excedido
                    </p>
                  )}
                  {porcentajeIndirectos >= 80 && porcentajeIndirectos < 100 && (
                    <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1">
                      <AlertTriangle size={12} /> Acercándote al límite
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* LISTADO DE CONCEPTOS */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                      Concepto
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Unidad
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Cant.
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Unitario
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Importe
                    </th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {indirectosItems.map((i) => (
                    <tr
                      key={i.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5 font-bold text-slate-800 text-xs uppercase">
                        {i.nombre}
                      </td>
                      <td className="px-8 py-5 text-center font-black text-slate-400 text-[10px] uppercase">
                        {i.unidad || "—"}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-700 text-xs">
                        {formatQty(i.cantidad)}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-500 text-xs">
                        {money(i.costo_unitario)}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-red-600 text-sm">
                        {money(i.importe)}
                      </td>
                      <td className="px-4 text-center">
                        <button
                          onClick={() => eliminarIndirecto(i.id)}
                          className="text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {indirectosItems.length === 0 && (
                <div className="p-20 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-slate-200" />
                  </div>
                  <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">
                    Aún no hay conceptos de indirectos capturados
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                {activeTab}{" "}
                {searchTerm && (
                  <span className="text-slate-400 normal-case font-medium">
                    — {filteredData.length} encontrados
                  </span>
                )}
              </h3>
              <div className="px-4 py-1.5 bg-red-50 rounded-full border border-red-100">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter">
                  Subtotal: {money(totalCategoriaActiva)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                      Clave
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                      Descripción
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Unidad
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Cant.
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Unitario
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Importe
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Avance Pedido
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Inventario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((i) => (
                    <tr
                      key={i.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-600 text-[11px] border border-slate-200">
                            {i.clave}
                          </span>
                          {i.es_extraordinario && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black text-[9px] border border-amber-200 uppercase">
                              Extra
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-800 text-xs uppercase leading-relaxed max-w-md">
                          {i.descripcion}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-slate-400 text-[10px] uppercase">
                          {i.unidad}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-700 text-xs">
                        {formatQty(i.cantidad)}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-500 text-xs">
                        {money(i.costo_unitario)}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-red-600 text-sm">
                        {money(i.importe)}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {(() => {
                          const porcentaje =
                            i.cantidad > 0
                              ? Math.min(
                                  (i.cantidad_pedida / i.cantidad) * 100,
                                  100,
                                )
                              : 0;

                          return (
                            <div className="w-40 mx-auto">
                              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 transition-all duration-500 ${
                                    porcentaje >= 100
                                      ? "bg-green-500"
                                      : porcentaje > 70
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>

                              <p className="text-[10px] font-black mt-1 text-slate-500">
                                {formatQty(i.cantidad_pedida)} /{" "}
                                {formatQty(i.cantidad)}
                              </p>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-5 text-center font-black text-emerald-600 text-xs">
                        {formatQty((i as any).inventario_extra ?? 0)}
                      </td>
                      <td className="px-4">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black"
                          onClick={() => abrirModalInventario(i)}
                        >
                          + Inventario
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="p-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchTerm ? (
                    <Search size={24} className="text-slate-200" />
                  ) : (
                    <Info size={24} className="text-slate-200" />
                  )}
                </div>
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  {searchTerm
                    ? `No se encontraron resultados para "${searchTerm}"`
                    : `No hay registros en ${activeTab}`}
                </p>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchTerm("")}
                    className="mt-4 text-[10px] font-black text-red-600 hover:text-red-700 uppercase"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: agregar inventario extra */}
      <Dialog open={openInventario} onOpenChange={setOpenInventario}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Agregar inventario extra
            </DialogTitle>
          </DialogHeader>

          {insumoSeleccionado && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border">
                <p className="text-[10px] text-slate-400 uppercase font-black">
                  Insumo seleccionado
                </p>
                <p className="font-bold text-sm mt-1">
                  {insumoSeleccionado.descripcion}
                </p>
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">
                  Cantidad a ingresar
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cantidadInv}
                  onChange={(e) => setCantidadInv(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Justificación */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">
                  Justificación obligatoria
                </label>
                <Textarea
                  placeholder="Ejemplo: sobrante de otra obra, compra urgente, ajuste de medición, etc..."
                  value={motivoInv}
                  onChange={(e) => setMotivoInv(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={guardarInventario}
                disabled={guardandoInv}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase"
              >
                {guardandoInv ? "Guardando..." : "Guardar inventario"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: definir presupuesto de indirectos */}
      <Dialog open={openPresupuesto} onOpenChange={setOpenPresupuesto}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Presupuesto de indirectos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">
                Monto total asignado
              </label>
              <Input
                type="number"
                placeholder="0"
                value={presupuestoInput}
                onChange={(e) => setPresupuestoInput(e.target.value)}
                className="h-12"
              />
            </div>
            <Button
              onClick={guardarPresupuesto}
              disabled={guardandoPresupuesto}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase"
            >
              {guardandoPresupuesto ? "Guardando..." : "Guardar presupuesto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: nuevo concepto de indirectos */}
      <Dialog open={openNuevoIndirecto} onOpenChange={setOpenNuevoIndirecto}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Agregar concepto de indirectos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">
                Nombre (ej. Tinta impresora, Escoba, Trapos)
              </label>
              <Input
                value={nombreInd}
                onChange={(e) => setNombreInd(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">
                  Unidad
                </label>
                <Input
                  placeholder="pza, l..."
                  value={unidadInd}
                  onChange={(e) => setUnidadInd(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">
                  Cantidad
                </label>
                <Input
                  type="number"
                  value={cantidadInd}
                  onChange={(e) => setCantidadInd(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">
                  Costo unit.
                </label>
                <Input
                  type="number"
                  value={costoInd}
                  onChange={(e) => setCostoInd(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            <Button
              onClick={guardarIndirecto}
              disabled={guardandoIndirecto}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase"
            >
              {guardandoIndirecto ? "Guardando..." : "Guardar concepto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

<Dialog open={openInsumoExtra} onOpenChange={setOpenInsumoExtra}>
  <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
    {/* Header */}
    <div className="relative border-b border-slate-100 bg-slate-50/50 px-8 py-6 overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />

      <DialogHeader className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-900/20">
            <Plus className="h-5 w-5 text-white" strokeWidth={3} />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
              Material extraordinario
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              No contemplado en el presupuesto original
            </p>
          </div>
        </div>
      </DialogHeader>
    </div>

    <div className="space-y-6 px-8 py-6">
      {/* Datos principales */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          Información del insumo
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Categoría
            </label>
            <select
              value={categoriaExtra}
              onChange={(e) => setCategoriaExtra(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wide text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
            >
              <option value="1">Materiales</option>
              <option value="2">Mano de obra</option>
              <option value="3">Herramienta</option>
              <option value="4">Equipo</option>
            </select>
          </div>

          {/* Clave */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Clave
            </label>
            <Input
              placeholder="Ej. MAT-001"
              value={claveExtra}
              onChange={(e) => setClaveExtra(e.target.value)}
              className="h-12 rounded-xl border-slate-200 font-bold focus-visible:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500">
            Descripción
          </label>
          <Input
            placeholder="Describe brevemente el material o insumo"
            value={descripcionExtra}
            onChange={(e) => setDescripcionExtra(e.target.value)}
            className="h-12 rounded-xl border-slate-200 font-bold focus-visible:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Cantidades */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          Cantidad y costo
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Unidad
            </label>
            <Input
              placeholder="pza, kg, m³..."
              value={unidadExtra}
              onChange={(e) => setUnidadExtra(e.target.value)}
              className="h-12 rounded-xl border-slate-200 font-bold focus-visible:ring-amber-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Cantidad
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={cantidadExtra}
              onChange={(e) => setCantidadExtra(e.target.value)}
              className="h-12 rounded-xl border-slate-200 text-right font-black tabular-nums focus-visible:ring-amber-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              Costo unit.
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                $
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={costoExtra}
                onChange={(e) => setCostoExtra(e.target.value)}
                className="h-12 rounded-xl border-slate-200 pl-7 text-right font-black tabular-nums focus-visible:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
              Importe estimado
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-amber-600/60 uppercase tracking-wide">
              Cantidad × costo unitario
            </p>
          </div>
          <span className="text-xl font-black tabular-nums text-amber-700">
            $
            {(
              (Number(cantidadExtra) || 0) * (Number(costoExtra) || 0)
            ).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Justificación */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase text-slate-500">
            Justificación
          </label>
          <span className="rounded-md bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-red-500">
            Obligatoria
          </span>
        </div>

        <Textarea
          placeholder="Explica por qué este insumo no estaba contemplado en el presupuesto original..."
          value={motivoExtra}
          onChange={(e) => setMotivoExtra(e.target.value)}
          className="min-h-[110px] resize-none rounded-xl border-slate-200 text-sm leading-relaxed focus-visible:ring-amber-500/20"
        />
        <p className="text-[10px] font-medium text-slate-400">
          Ejemplo: cambio de especificación, trabajo adicional solicitado o
          material no considerado inicialmente.
        </p>
      </div>
    </div>

    {/* Footer */}
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-5 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        disabled={guardandoExtra}
        onClick={() => setOpenInsumoExtra(false)}
        className="h-12 rounded-xl border-slate-200 px-6 font-black uppercase text-[10px] text-slate-500 hover:bg-slate-50"
      >
        Cancelar
      </Button>

      <Button
        type="button"
        onClick={guardarInsumoExtra}
        disabled={
          guardandoExtra ||
          !descripcionExtra.trim() ||
          !unidadExtra.trim() ||
          !cantidadExtra ||
          !costoExtra ||
          !motivoExtra.trim()
        }
        className="h-12 rounded-xl bg-amber-500 px-6 font-black uppercase text-[10px] text-white shadow-lg shadow-amber-900/20 hover:bg-amber-600"
      >
        {guardandoExtra ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Guardar insumo
          </>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}
