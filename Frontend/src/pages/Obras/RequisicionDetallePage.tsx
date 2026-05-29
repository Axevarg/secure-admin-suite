import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  ArrowLeft, 
  Calendar, 
  User, 
  Layers, 
  Tag,
  CheckCircle2,
  Clock
} from "lucide-react";

interface Detalle {
  id: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  fecha_requerida: string;
}

interface Requisicion {
  id: number;
  folio: string;
  partida: string;
  solicitante: string;
  estado: string;
  created_at: string;
}

const estadoConfig: Record<string, { label: string; class: string; icon: any }> = {
  borrador: { label: "Borrador", class: "bg-slate-100 text-slate-500 border-slate-200", icon: Clock },
  enviada: { label: "Enviada", class: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  aprobada: { label: "Aprobada", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

export default function RequisicionDetallePage() {
  const { reqId } = useParams();
  const navigate = useNavigate();

  const [requisicion, setRequisicion] = useState<Requisicion | null>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.get(`/requisiciones/${reqId}`);
      setRequisicion(res.data.requisicion);
      setDetalles(res.data.detalles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reqId]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Cargando SIGO...</p>
      </div>
    </div>
  );

  if (!requisicion) return <div className="p-20 text-center font-black uppercase text-slate-400">Requisición no encontrada</div>;

  const StatusIcon = estadoConfig[requisicion.estado]?.icon || Clock;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-4 rounded-[1.5rem] shadow-xl shadow-slate-900/20">
            <ClipboardList className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
                {requisicion.folio}
              </h1>
              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${estadoConfig[requisicion.estado]?.class || "bg-slate-50 text-slate-400"}`}>
                <StatusIcon size={12} strokeWidth={3} />
                {requisicion.estado}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">Detalle de Requisición Técnica</p>
          </div>
        </div>

        <Button 
          onClick={() => navigate(-1)} 
          variant="outline" 
          className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-900 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest gap-2"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Regresar al Panel
        </Button>
      </div>

      {/* GRID DE INFORMACIÓN GENERAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard 
          icon={<Layers className="text-red-600" size={16}/>} 
          label="Partida / Frente" 
          value={requisicion.partida} 
        />
        <InfoCard 
          icon={<User className="text-red-600" size={16}/>} 
          label="Solicitante" 
          value={requisicion.solicitante} 
        />
        <InfoCard 
          icon={<Calendar className="text-red-600" size={16}/>} 
          label="Fecha Registro" 
          value={new Date(requisicion.created_at).toLocaleDateString("es-MX", { day: '2-digit', month: 'long', year: 'numeric' })} 
        />
        <InfoCard 
          icon={<Tag className="text-red-600" size={16}/>} 
          label="ID Sistema" 
          value={`#${requisicion.id.toString().padStart(4, '0')}`} 
        />
      </div>

      {/* TABLA DE INSUMOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-900">Listado de Materiales e Insumos</h3>
          <span className="bg-white px-4 py-1.5 rounded-full border border-slate-200 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            {detalles.length} Partidas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-6 text-left pl-10">Descripción del Insumo</th>
                <th className="p-6 text-center">Unidad</th>
                <th className="p-6 text-center">Cantidad</th>
                <th className="p-6 text-right pr-10">Fecha Requerida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {detalles.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6 pl-10">
                    <div className="font-bold text-sm text-slate-900 uppercase group-hover:text-red-600 transition-colors">
                      {d.descripcion}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-[10px] text-slate-500 uppercase">
                      {d.unidad}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-lg font-black text-slate-900 tracking-tighter">
                      {d.cantidad}
                    </span>
                  </td>
                  <td className="p-6 text-right pr-10">
                    <div className="flex items-center justify-end gap-2 text-slate-500 font-bold text-xs">
                      <Calendar size={14} className="text-slate-300" />
                      {new Date(d.fecha_requerida).toLocaleDateString("es-MX")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {detalles.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="bg-slate-50 p-6 rounded-full">
                <ClipboardList className="text-slate-200" size={40} />
              </div>
              <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                Esta requisición no tiene insumos registrados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-red-600/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      </div>
      <p className="font-black text-slate-900 uppercase text-xs tracking-tight truncate">
        {value}
      </p>
    </div>
  );
}