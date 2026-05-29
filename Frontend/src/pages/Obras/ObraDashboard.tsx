import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  FileText,
  CreditCard,
  Box,
  Activity,
  ChevronRight,
  Construction,
  HardHat,
} from "lucide-react";

type EstadoItem = {
  estado: string;
  count: number;
};

type Actividad = {
  accion: string;
  detalle: string;
  fecha: string;
};

type DashboardData = {
  gastoTotal: number;
  totalRequisiciones: number;
  totalRemesas: number;
  insumosSolicitados: number;
  requisicionesEstado: EstadoItem[];
  remesasEstado: EstadoItem[];
  actividad: Actividad[];

  presupuestoTotal: number;
  requisitadoAprobado: number;
  porcentajeConsumido: number;
};

export default function ObraDashboard() {
  const { id } = useParams();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api
      .get(`/api/obras/${id}/dashboard`)
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
          Analizando indicadores...
        </p>
      </div>
    );

  const COLORS = ["#0f172a", "#dc2626", "#475569", "#94a3b8"];

  const presupuestoChart = [
    { name: "Total", monto: data.presupuestoTotal },
    { name: "Consumido", monto: data.requisitadoAprobado },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* ===== TITULO COMO TARJETA (BANNER SIGO) ===== */}
      <div className="bg-slate-50 rounded-[2.5rem] p-10 text-black relative overflow-hidden shadow-2xl border-b-8 border-red-600">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
          <Construction size={240} />
        </div>

        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600 p-2 rounded-xl">
                <HardHat size={24} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">
                Módulo de Seguimiento
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
              Dashboard de <span className="text-red-600">Obra</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-md italic">
              Visualización de métricas presupuestarias y flujo de insumos del
              proyecto.
            </p>
          </div>

          <div className="text-right hidden md:block">
            <div className="bg-slate-100/50 px-6 py-3 rounded-2xl border border-slate-700 inline-block">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
                Identificador
              </p>
              <p className="text-xl font-mono font-bold text-black uppercase tracking-tighter">
                OB-{id?.padStart(4, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs REDISEÑADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Presupuesto Base"
          value={`$${data.presupuestoTotal.toLocaleString()}`}
          icon={TrendingUp}
          color="text-slate-900"
        />
        <KpiCard
          title="Total Requisitado"
          value={`$${data.totalRequisiciones.toLocaleString()}`}
          icon={FileText}
          color="text-red-600"
        />
        <KpiCard
          title="Remesas Emitidas"
          value={data.totalRemesas}
          icon={CreditCard}
          color="text-slate-900"
        />
        <KpiCard
          title="Insumos Solicitados"
          value={data.insumosSolicitados}
          icon={Box}
          color="text-slate-900"
        />
        <KpiCard
          title="Eficiencia de Gasto"
          value={`${data.porcentajeConsumido}%`}
          icon={Activity}
          color={
            data.porcentajeConsumido > 90 ? "text-red-600" : "text-green-600"
          }
        />
      </div>

      {/* BARRA DE PROGRESO INDUSTRIAL */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-white font-black uppercase tracking-widest text-xs">
              Ejecución Presupuestaria
            </h2>
            <span className="text-red-500 font-black text-2xl tracking-tighter">
              {data.porcentajeConsumido}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-2xl h-8 p-1.5 border border-slate-700">
            <div
              className="bg-red-600 h-full rounded-xl transition-all duration-1000 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-end px-3"
              style={{ width: `${data.porcentajeConsumido}%` }}
            >
              <div className="w-1 h-3 bg-white/30 rounded-full" />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 min-w-[200px]">
              <p className="text-[9px] font-black uppercase text-slate-500 mb-1">
                Monto Asignado
              </p>
              <p className="text-white font-bold tracking-tight">
                ${data.presupuestoTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 min-w-[200px] text-right">
              <p className="text-[9px] font-black uppercase text-slate-500 mb-1">
                Monto Requisitado
              </p>
              <p className="text-red-500 font-bold tracking-tight">
                ${data.requisitadoAprobado.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICAS TÉCNICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ChartContainer title="Estatus de Requisiciones">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.requisicionesEstado}
              margin={{ top: 20, right: 20, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="estado"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="count"
                fill="#0f172a"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Distribución de Remesas">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.remesasEstado}
                dataKey="count"
                nameKey="estado"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
              >
                {data.remesasEstado.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Presupuesto vs Uso">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={presupuestoChart}
              margin={{ top: 20, right: 20, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar
                dataKey="monto"
                fill="#dc2626"
                radius={[6, 6, 0, 0]}
                barSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <Activity size={16} className="text-red-600" /> Registro de
            Actividad
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-1">
            {data.actividad.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
              >
                <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-red-100 transition-colors">
                  <ChevronRight
                    size={14}
                    className="group-hover:text-red-600"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-black text-xs uppercase text-slate-800 tracking-tight">
                    {a.accion}
                  </p>
                  <p className="text-slate-500 text-[11px] italic font-medium">
                    {a.detalle}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  {new Date(a.fecha).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: any;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-3 rounded-2xl bg-slate-50 group-hover:bg-red-50 transition-colors ${color}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
        {title}
      </p>
      <h2 className={`text-2xl font-black tracking-tighter ${color}`}>
        {value}
      </h2>
    </div>
  );
}

function ChartContainer({ title, children }: { title: string; children: any }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
