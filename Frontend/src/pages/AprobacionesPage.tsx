import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Building2,
  User,
  Calendar,
  AlertCircle,
  FileText,
  X,
  Search,
  Filter,
  History
} from "lucide-react";

interface Req {
  id: number;
  folio: string;
  obra: string;
  solicitado_por: string;
  fecha_envio: string;
  estado: string;
}

interface Detalle {
  id: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  fecha_requerida: string;
}

export default function AprobacionesPage() {
  const [requisiciones, setRequisiciones] = useState<Req[]>([]);
  const [open, setOpen] = useState(false);
  const [requisicion, setRequisicion] = useState<any>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [tab, setTab] = useState<"pendientes" | "aprobadas" | "rechazadas">("pendientes");

  // Estados para búsqueda y filtrado
  const [search, setSearch] = useState("");
  const [filtroObra, setFiltroObra] = useState("");

  const loadData = async (tabActual = tab) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/validacion-requisiciones/${tabActual}`);
      setRequisiciones(data);
    } catch (error) {
      console.error("Error al cargar aprobaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  // Filtrado Lógico
  const requisicionesFiltradas = requisiciones.filter(r => {
   const matchesSearch =
  (r.folio || "").toLowerCase().includes(search.toLowerCase()) ||
  (r.solicitado_por || "").toLowerCase().includes(search.toLowerCase());
    const matchesObra = filtroObra === "" || r.obra === filtroObra;
    return matchesSearch && matchesObra;
  });

  // Obtener obras únicas para el select del filtro
  const obrasUnicas = Array.from(new Set(requisiciones.map(r => r.obra)));

  const abrirModal = async (id: number) => {
    try {
      const { data } = await api.get(`/validacion-requisiciones/${id}`);
      const hist = await api.get(`/validacion-requisiciones/${id}/historial`);
      setHistorial(hist.data);
      setRequisicion(data.requisicion);
      setDetalles(data.detalles);
      setOpen(true);
    } catch (error) {
      alert("No se pudo cargar el detalle");
    }
  };

  const cerrarModal = () => {
    setOpen(false);
    setMotivo("");
    setRequisicion(null);
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const autorizar = async () => {
    if (!confirm("¿Confirmar autorización de esta requisición?")) return;
    await api.put(`/validacion-requisiciones/${requisicion.id}/autorizar`);
    cerrarModal();
    loadData();
  };

  const rechazar = async () => {
    if (!motivo) return alert("Por favor, especifica el motivo del rechazo");
    await api.put(`/validacion-requisiciones/${requisicion.id}/rechazar`, { motivo });
    cerrarModal();
    loadData();
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">

      {/* HEADER SIGO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <CheckCircle size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Bandeja de Aprobaciones</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {tab === "pendientes" && "Requisiciones pendientes de autorización"}
            {tab === "aprobadas" && "Historial de requisiciones autorizadas"}
            {tab === "rechazadas" && "Requisiciones rechazadas"}
          </p>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Items en Vista</span>
          <span className="text-2xl font-black text-slate-900">{requisicionesFiltradas.length.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* CONTROLES: TABS + BUSCADOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
        <div className="flex gap-2">
          {[
            { key: "pendientes", label: "Pendientes", color: "bg-amber-500" },
            { key: "aprobadas", label: "Aprobadas", color: "bg-emerald-500" },
            { key: "rechazadas", label: "Rechazadas", color: "bg-red-500" },
          ].map((t: any) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border
                ${tab === t.key ? `${t.color} text-white shadow-lg shadow-${t.key}/20 border-transparent` : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={16} />
            <Input 
              placeholder="BUSCAR POR FOLIO O SOLICITANTE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 rounded-2xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-widest focus-visible:ring-red-600/10"
            />
          </div>
          <div className="relative group min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={16} />
            <select
              value={filtroObra}
              onChange={(e) => setFiltroObra(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none focus:ring-2 focus:ring-red-600/10 outline-none cursor-pointer"
            >
              <option value="">TODAS LAS OBRAS</option>
              {obrasUnicas.map(obra => (
                <option key={obra} value={obra}>{obra}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLA DE APROBACIONES */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="font-black text-[10px] uppercase pl-10 py-5 tracking-widest text-slate-400">Folio</th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">Obra Destino</th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">Solicitante</th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">Envío</th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400 text-right pr-10">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requisicionesFiltradas.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="pl-10 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-red-600 p-2 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                        <FileText size={16} />
                      </div>
                      <span className="text-slate-900 font-black text-sm uppercase">{r.folio}</span>
                    </div>
                  </td>
                  <td className="py-5 font-bold text-xs text-slate-600 uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-300" /> {r.obra}
                    </div>
                  </td>
                  <td className="py-5 font-bold text-xs text-slate-500 uppercase">{r.solicitado_por}</td>
                  <td className="py-5">
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                      {formatFecha(r.fecha_envio)}
                    </span>
                  </td>
                  <td className="py-5 pr-10 text-right">
                    <Button
                      onClick={() => abrirModal(r.id)}
                      className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-10 px-6 rounded-xl transition-all"
                    >
                      REVISAR
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requisicionesFiltradas.length === 0 && !loading && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-300">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">No se encontraron resultados</p>
          </div>
        )}
      </div>

      {/* MODAL DE REVISIÓN */}
      {open && requisicion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[1rem] overflow-hidden shadow-2xl flex flex-col border border-white/20">

            {/* Header del Modal */}
            <div className="bg-slate-900 p-8 text-white relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 shadow-[0_4px_20px_rgba(220,38,38,0.5)]" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-2xl uppercase font-black text-xs tracking-tighter">SIGO v2</div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{requisicion.folio}</h2>
                </div>
                <button onClick={cerrarModal} className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InfoItem label="Obra Destino" value={requisicion.obra} icon={<Building2 size={12} />} />
                <InfoItem label="Partida" value={requisicion.partida} icon={<Layers size={12} />} />
                <InfoItem label="Solicitante" value={requisicion.solicitado_por} icon={<User size={12} />} />
                <InfoItem label="Fecha Envío" value={formatFecha(requisicion.fecha_envio)} icon={<Calendar size={12} />} />
              </div>

              {/* Insumos Table */}
              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden">
                <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Materiales Requeridos</div>
                <table className="w-full">
                  <tbody className="divide-y divide-slate-50">
                    {detalles.map((d) => (
                      <tr key={d.id} className="text-xs">
                        <td className="p-4 pl-8 font-black uppercase text-slate-700">{d.descripcion}</td>
                        <td className="p-4 text-center font-bold text-slate-400">{d.unidad}</td>
                        <td className="p-4 text-center font-black text-slate-900">{d.cantidad}</td>
                        <td className="p-4 text-right pr-8 font-bold text-slate-400 italic">{formatFecha(d.fecha_requerida)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {/* Acción de Rechazo */}
              {requisicion.estado === "enviada" && (
                <div className="space-y-3 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-red-600 ml-4">Motivo de Rechazo</label>
                  <textarea
                    placeholder="ESCRIBA EL MOTIVO AQUÍ..."
                    className="w-full h-24 border-slate-100 bg-slate-50/50 rounded-[2rem] p-6 text-xs font-bold uppercase focus:ring-2 focus:ring-red-600/10 outline-none resize-none"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              )}
              
              {/* Historial Estilizado */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-4">
                  <History size={14} className="text-red-600" />
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-900">Historial de Movimientos</h3>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6">
                  <div className="space-y-4">
                    {historial.map((h: any) => (
                      <div key={h.id} className="flex gap-4 items-start relative pb-4 last:pb-0 border-b border-slate-100/50 last:border-0">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm font-black text-[8px] text-slate-400 w-24 text-center">
                          {new Date(h.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase text-slate-900">{h.usuario}</span>
                            <span className="text-[8px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-md leading-none">{h.accion}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 italic">"{h.comentario || 'Sin observaciones'}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button onClick={cerrarModal} className="font-black text-[10px] uppercase text-slate-400 tracking-widest hover:text-slate-900">Cerrar Detalle</button>

              {requisicion.estado === "enviada" && (
                <div className="flex gap-3">
                  <Button onClick={rechazar} className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-black px-8 rounded-2xl uppercase tracking-widest text-[10px] h-12 transition-all">
                    Rechazar
                  </Button>
                  <Button onClick={autorizar} className="bg-slate-900 text-white font-black px-8 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl border-none">
                    Autorizar Suministro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        <span className="text-red-600">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className="text-xs font-black text-slate-900 uppercase truncate">{value}</p>
    </div>
  );
}

function Layers({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}