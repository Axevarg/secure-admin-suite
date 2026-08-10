import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Construction,
  Users,
  AlertTriangle,
  Package,
  HardHat,
  Clock,
  ArrowUpRight
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [actividad, setActividad] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/global");
      setStats(res.data.stats);
      setActividad(res.data.actividad || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sincronizando SIGO...</p>
    </div>
  );

  const cards = [
    {
      label: "Proyectos Activos",
      value: stats.obras_activas,
      icon: Construction,
      accent: "text-red-600",
      bg: "bg-red-50"
    },
    {
      label: "Personal en Obra",
      value: stats.personal_activo,
      icon: Users,
      accent: "text-slate-900",
      bg: "bg-slate-100"
    },
    {
      label: "Requisiciones Pendientes",
      value: stats.requisiciones_pendientes,
      icon: AlertTriangle,
      accent: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      label: "Material Entregado",
      value: stats.materiales_entregados,
      icon: Package,
      accent: "text-blue-600",
      bg: "bg-blue-50"
    }
  ];

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500 p-2">

      {/* Banner Principal SIGO */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-red-600">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
          <HardHat size={280} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-600 p-2 rounded-xl">
              <Construction size={24} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">Sistema SIGO v2.0</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Panel de <span className="text-red-600">Control Operativo</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium max-w-md italic">
            Monitorización en tiempo real de activos, personal e insumos de Constructora Iliasa.
          </p>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`${card.bg} ${card.accent} p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300`}>
                  <Icon size={24} />
                </div>
          
              </div>
              
              <div className="mt-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</h4>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{card.value}</div>
              </div>
              
              {/* Decoración sutil */}
              <div className="absolute bottom-0 right-0 w-24 h-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
          );
        })}
      </div>

      {/* Actividad reciente y Log de Operaciones */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Clock className="text-red-600" size={18} />
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Historial de Operaciones</h3>
            </div>
            <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-slate-400 shadow-sm border uppercase">Últimos 20 movimientos</span>
          </div>

          <div className="p-4">
            {actividad.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Esperando nueva actividad...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {actividad.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-red-600 group-hover:animate-pulse" />
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.accion}</p>
                      <p className="text-[11px] text-slate-500 font-medium italic">{item.detalle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400">
                        {new Date(item.fecha).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Informativo (Slogan o Info extra) */}
        <div className="bg-red-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Construction size={120} />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Seguridad</h4>
           
          </div>
          <div className="mt-20">

          </div>
        </div>
      </div>

    </div>
  );
}