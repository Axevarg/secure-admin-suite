import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import {
  TrendingUp, TrendingDown, Wallet, Building2,
  ArrowUpRight, ArrowDownRight, BarChart3, Activity,
} from "lucide-react";

interface Dashboard {
  cuentas_activas: number;
  ingresos_mes: number;
  gastos_mes: number;
  balance_mes: number;
  total_ingresos: number;
  total_gastos: number;
  dinero_en_bancos: number;
}

interface Movimiento {
  id: number;
  tipo: string;
  concepto: string;
  monto: number;
  fecha_movimiento: string;
  cuenta_nombre: string;
  categoria_nombre: string;
}

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function BancosDashboard() {
  const navigate = useNavigate();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [recientes, setRecientes] = useState<Movimiento[]>([]);

  useEffect(() => {
    api.get("/bancos/dashboard").then((r) => setDash(r.data));
    api.get("/bancos/movimientos").then((r) => setRecientes(r.data.slice(0, 8)));
  }, []);

  const cards = dash
    ? [
        {
          label: "Dinero en Bancos",
           value: `$${fmt(dash.dinero_en_bancos)}`,
          sub: "Balance histórico total",
          icon: <Wallet size={22} />,
          color: "bg-slate-900 text-white",
          accent: "text-emerald-400",
        },
        {
          label: "Ingresos del Mes",
          value: `$${fmt(dash.ingresos_mes)}`,
          sub: "Entradas confirmadas",
          icon: <TrendingUp size={22} />,
          color: "bg-emerald-600 text-white",
          accent: "text-emerald-200",
        },
        {
          label: "Gastos del Mes",
          value: `$${fmt(dash.gastos_mes)}`,
          sub: "Salidas confirmadas",
          icon: <TrendingDown size={22} />,
          color: "bg-red-600 text-white",
          accent: "text-red-200",
        },
        {
          label: "Balance del Mes",
          value: `$${fmt(dash.balance_mes)}`,
          sub: dash.balance_mes >= 0 ? "Mes positivo ✓" : "Mes negativo ✗",
          icon: <BarChart3 size={22} />,
          color: dash.balance_mes >= 0 ? "bg-blue-600 text-white" : "bg-amber-600 text-white",
          accent: dash.balance_mes >= 0 ? "text-blue-200" : "text-amber-200",
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] p-8 overflow-hidden text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #ef4444 0%, transparent 60%)" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-600 p-2 rounded-xl">
                <Activity size={20} className="text-white" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Control <span className="text-red-500">Financiero</span>
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Panel de cuentas bancarias y movimientos
            </p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <button
              onClick={() => navigate("/bancos/cuentas")}
              className="bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest px-5 h-11 rounded-xl transition-all flex items-center gap-2"
            >
              <Building2 size={16} /> Cuentas
            </button>
            <button
              onClick={() => navigate("/bancos/movimientos")}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest px-5 h-11 rounded-xl transition-all flex items-center gap-2"
            >
              <BarChart3 size={16} /> Movimientos
            </button>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`${c.color} rounded-[1.75rem] p-6 shadow-lg`}>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/15 p-2 rounded-xl">{c.icon}</div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${c.accent}`}>
                {c.label}
              </span>
            </div>
            <p className="text-2xl font-black tracking-tighter">{c.value}</p>
            <p className={`text-[10px] font-bold mt-1 ${c.accent}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ÚLTIMOS MOVIMIENTOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-red-600 rounded-full" />
            <h2 className="font-black text-[11px] uppercase tracking-widest text-slate-500">
              Últimos Movimientos
            </h2>
          </div>
          <button
            onClick={() => navigate("/bancos/movimientos")}
            className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 tracking-widest"
          >
            Ver todos →
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {recientes.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className={`p-2 rounded-xl ${
                m.tipo === "ingreso" ? "bg-emerald-100 text-emerald-600"
                : m.tipo === "gasto" ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
              }`}>
                {m.tipo === "ingreso" ? <ArrowDownRight size={16} />
                 : m.tipo === "gasto" ? <ArrowUpRight size={16} />
                 : <Activity size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs text-slate-800 uppercase truncate">
                  {m.concepto ?? "Sin concepto"}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {m.cuenta_nombre} · {m.categoria_nombre ?? "Sin categoría"}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${
                  m.tipo === "ingreso" ? "text-emerald-600"
                  : m.tipo === "gasto" ? "text-red-600"
                  : "text-blue-600"
                }`}>
                  {m.tipo === "gasto" ? "-" : "+"}${fmt(m.monto)}
                </p>
                <p className="text-[9px] text-slate-400 font-bold">
                  {new Date(m.fecha_movimiento).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>
          ))}
          {recientes.length === 0 && (
            <p className="text-center py-12 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              Sin movimientos registrados
            </p>
          )}
        </div>
      </div>
    </div>
  );
}