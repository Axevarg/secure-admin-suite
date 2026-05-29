import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Save,
  Timer,
  Construction,
  User,
  Info,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  FileDown,
  Calendar,
  CalendarRange,
  Activity,
  ChevronRight,
} from "lucide-react";

interface TrabajadorRow {
  trabajador_id: number;
  nombre: string;
  estado?: "asistio" | "tarde" | "falta";
  hora_entrada?: string;
  hora_salida?: string;
  horas_extra?: number;
}

const today = new Date().toISOString().slice(0, 10);

export default function AsistenciaPage() {
  const { id } = useParams();
  const [obra, setObra] = useState<any>(null);
  const [fecha, setFecha] = useState(today);
  const [rows, setRows] = useState<TrabajadorRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [openReportes, setOpenReportes] = useState(false);
  const [diaCerrado, setDiaCerrado] = useState(false);

  const generarPDF = (tipo: string) => {
    let url = `/asistencias/reporte/${id}?tipo=${tipo}`;

    if (tipo === "dia") {
      url += `&fechaInicio=${fecha}`;
    }

    if (tipo === "rango") {
      url += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }

    window.open(import.meta.env.VITE_API_URL + url, "_blank");
  };

  useEffect(() => {
    const activeObra = JSON.parse(localStorage.getItem("activeObra") || "null");
    setObra(activeObra);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/asistencias/obra/${id}?fecha=${fecha}`);
      setRows(res.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const verificarCierre = async () => {
    try {
      const res = await api.get(
        `/asistencias/dia-cerrado/${id}?fecha=${fecha}`,
      );
      setDiaCerrado(res.data.cerrado);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadData();
    verificarCierre();
  }, [fecha, id]);

  // Lógica de filtrado en tiempo real
  const filteredRows = rows.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Actualización por ID para que el buscador no afecte los índices
  const setEstado = (
    trabajadorId: number,
    estado: "asistio" | "tarde" | "falta",
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.trabajador_id !== trabajadorId) return r;

        const newRow = { ...r, estado };
        if (estado === "falta") {
          newRow.hora_entrada = "";
          newRow.hora_salida = "";
          newRow.horas_extra = 0;
        } else {
          newRow.hora_entrada = r.hora_entrada || "08:00";
          newRow.hora_salida = r.hora_salida || "17:00";
          newRow.horas_extra = r.horas_extra || 0;
        }
        return newRow;
      }),
    );
  };

  const updateField = (
    trabajadorId: number,
    field: keyof TrabajadorRow,
    value: any,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.trabajador_id === trabajadorId ? { ...r, [field]: value } : r,
      ),
    );
  };

  const ReportCard = ({ onClick, label, sub, icon }: any) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white group transition-all duration-300 active:scale-95"
    >
      <div className="text-red-500 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-white group-hover:text-slate-900 font-black text-[10px] uppercase tracking-tighter leading-none mb-1">
          {label}
        </p>
        <p className="text-slate-500 group-hover:text-slate-400 text-[8px] font-bold uppercase italic tracking-tighter">
          {sub}
        </p>
      </div>
    </button>
  );

  const guardar = async () => {
    try {
      setSaving(true);
      await api.post("/asistencias/guardar-dia", {
        obra_id: id,
        fecha,
        registros: rows,
      });
      alert("Asistencia guardada con éxito ✔");
    } catch (err) {
      console.error(err);
      alert("Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Sincronizando SIGO...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 p-4 md:p-8 space-y-6">
      {/* HEADER SIGO */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden max-w-7xl mx-auto">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <Construction
                size={20}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">
              Personal de Obra
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {obra?.nombre || "Control de Asistencia"}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-transparent border-none text-slate-900 font-black text-xs uppercase focus-visible:ring-0 w-full sm:w-40 h-10"
          />
          {!diaCerrado && (
            <Button
              onClick={guardar}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] h-10 px-6 rounded-xl transition-all shadow-lg shadow-red-900/20"
            >
              {saving ? (
                <Timer className="animate-spin mr-2" size={14} />
              ) : (
                <Save size={14} className="mr-2" strokeWidth={3} />
              )}
              {saving ? "..." : "Guardar"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={openReportes} onOpenChange={setOpenReportes}>
        <DialogContent className="max-w-2xl bg-slate-950 p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          {/* Encabezado del Modal */}
          <div className="p-8 bg-slate-900 border-b border-white/5 relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
              <FileText size={160} className="text-white" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
                <FileDown className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-white font-black text-xl uppercase tracking-tighter">
                  Exportación Oficial
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  Generador de Documentos SIGO
                </p>
              </div>
            </div>
          </div>

          {/* Cuerpo del Modal */}
          <div className="p-8 space-y-8">
            {/* SECCIÓN 1: PERIODOS RÁPIDOS */}
            <div>
              <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-2">
                Selección Rápida
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <ReportCard
                  onClick={() => {
                    generarPDF("dia");
                    setOpenReportes(false);
                  }}
                  label="Reporte del Día"
                  sub="Fecha actual"
                  icon={<Calendar size={20} />}
                />
                <ReportCard
                  onClick={() => {
                    generarPDF("semana");
                    setOpenReportes(false);
                  }}
                  label="Semana"
                  sub="Periodo actual"
                  icon={<CalendarRange size={20} />}
                />
                <ReportCard
                  onClick={() => {
                    generarPDF("mes");
                    setOpenReportes(false);
                  }}
                  label="Mes Completo"
                  sub="Cierre mensual"
                  icon={<Activity size={20} />}
                />
              </div>
            </div>

            {/* SECCIÓN 2: RANGO PERSONALIZADO */}
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 relative">
              <h3 className="text-red-500 text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1">
                Rango Personalizado de Fechas
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Fecha Inicio
                  </label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white font-bold rounded-xl h-12 focus:ring-red-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Fecha Término
                  </label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white font-bold rounded-xl h-12 focus:ring-red-600"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  generarPDF("rango");
                  setOpenReportes(false);
                }}
                className="w-full bg-red-600 hover:bg-white hover:text-red-600 text-white font-black uppercase tracking-widest text-[11px] py-7 rounded-2xl transition-all shadow-xl shadow-red-900/20 group"
              >
                Generar Reporte Personalizado
                <ChevronRight
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                  size={16}
                />
              </Button>
            </div>
          </div>

          {/* Pie del Modal */}
          <div className="p-6 bg-slate-900/50 flex justify-center border-t border-white/5">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">
              Constructora Iliasa — Control de Activos y Personal
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* BARRA DE BÚSQUEDA Y ACCIONES */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-stretch">
        {/* BUSCADOR (CRECE PARA OCUPAR EL ESPACIO) */}
        <div className="relative group flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
            size={18}
          />
          <Input
            placeholder="BUSCAR TRABAJADOR POR NOMBRE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-slate-100 rounded-2xl pl-12 h-14 font-bold text-xs uppercase tracking-widest shadow-sm focus-visible:ring-red-600/20"
          />
        </div>

        {/* ===== BOTÓN DISPARADOR DE REPORTES ===== */}
        <Button
          onClick={() => setOpenReportes(true)}
          className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] px-8 h-14 rounded-2xl shadow-xl transition-all flex items-center gap-3 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 shrink-0"
        >
          <FileDown size={18} />
          <span className="hidden sm:inline">Centro de Reportes</span>
          <span className="sm:hidden">Reportes</span>
        </Button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* VISTA ESCRITORIO */}
        <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Trabajador
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                  Estado
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Horario / Extras
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((t) => (
                <tr
                  key={t.trabajador_id}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                        <User size={18} />
                      </div>
                      <span className="font-black text-slate-800 uppercase text-sm">
                        {t.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-3">
                      <StatusButton
                        active={t.estado === "asistio"}
                        type="asistio"
                        onClick={() => setEstado(t.trabajador_id, "asistio")}
                      />
                      <StatusButton
                        active={t.estado === "tarde"}
                        type="tarde"
                        onClick={() => setEstado(t.trabajador_id, "tarde")}
                      />
                      <StatusButton
                        active={t.estado === "falta"}
                        type="falta"
                        onClick={() => setEstado(t.trabajador_id, "falta")}
                      />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {t.estado === "asistio" || t.estado === "tarde" ? (
                      <div className="flex gap-3">
                        <InputTime
                          value={t.hora_entrada}
                          label="Entrada"
                          onChange={(v: string) =>
                            updateField(t.trabajador_id, "hora_entrada", v)
                          }
                        />
                        <InputTime
                          value={t.hora_salida}
                          label="Salida"
                          onChange={(v: string) =>
                            updateField(t.trabajador_id, "hora_salida", v)
                          }
                        />
                        <InputNumber
                          value={t.horas_extra}
                          label="Extras"
                          onChange={(v: number) =>
                            updateField(t.trabajador_id, "horas_extra", v)
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-tighter px-4">
                        Sin actividad
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL */}
        <div className="lg:hidden space-y-4">
          {filteredRows.map((t) => (
            <div
              key={t.trabajador_id}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5 animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-8 rounded-full ${t.estado === "asistio" ? "bg-green-500" : t.estado === "tarde" ? "bg-amber-500" : t.estado === "falta" ? "bg-red-600" : "bg-slate-200"}`}
                />
                <h3 className="font-black text-slate-900 uppercase text-base tracking-tight">
                  {t.nombre}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MobileStatusButton
                  active={t.estado === "asistio"}
                  type="asistio"
                  onClick={() => setEstado(t.trabajador_id, "asistio")}
                />
                <MobileStatusButton
                  active={t.estado === "tarde"}
                  type="tarde"
                  onClick={() => setEstado(t.trabajador_id, "tarde")}
                />
                <MobileStatusButton
                  active={t.estado === "falta"}
                  type="falta"
                  onClick={() => setEstado(t.trabajador_id, "falta")}
                />
              </div>

              {(t.estado === "asistio" || t.estado === "tarde") && (
                <div className="grid grid-cols-3 gap-2 pt-2 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                  <InputTime
                    value={t.hora_entrada}
                    label="Entrada"
                    onChange={(v: string) =>
                      updateField(t.trabajador_id, "hora_entrada", v)
                    }
                  />
                  <InputTime
                    value={t.hora_salida}
                    label="Salida"
                    onChange={(v: string) =>
                      updateField(t.trabajador_id, "hora_salida", v)
                    }
                  />
                  <InputNumber
                    value={t.horas_extra}
                    label="Ext"
                    onChange={(v: number) =>
                      updateField(t.trabajador_id, "horas_extra", v)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ESTADO VACÍO */}
        {filteredRows.length === 0 && (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
            {searchTerm ? (
              <Search size={40} className="mx-auto text-slate-200 mb-4" />
            ) : (
              <Info size={40} className="mx-auto text-slate-200 mb-4" />
            )}
            <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">
              {searchTerm
                ? `No se encontró a "${searchTerm}"`
                : "No hay trabajadores registrados"}
            </p>
          </div>
        )}
      </div>

      {/* RESUMEN FLOTANTE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-slate-900/95 backdrop-blur-md rounded-full py-4 px-10 shadow-2xl z-40 flex justify-between items-center border border-white/10">
        <div className="flex gap-8">
          <ResumenItem
            label="Asistieron"
            count={rows.filter((r) => r.estado === "asistio").length}
            color="text-green-500"
          />
          <ResumenItem
            label="Faltas"
            count={rows.filter((r) => r.estado === "falta").length}
            color="text-red-500"
          />
        </div>
        <p className="hidden sm:block text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
          SIGO v2.0
        </p>
      </div>
    </div>
  );
}

/** COMPONENTES DE APOYO **/

const ReportButton = ({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: any;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 bg-white/5 hover:bg-white hover:text-slate-900 text-white px-4 py-3 rounded-xl transition-all border border-white/5 group"
  >
    <span className="text-red-500 group-hover:text-red-600 transition-colors">
      {icon}
    </span>
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);

const StatusButton = ({ active, type, onClick }: any) => {
  const configs = {
    asistio: {
      bg: "bg-green-600",
      icon: <CheckCircle2 size={14} />,
      label: "Asistió",
    },
    tarde: { bg: "bg-amber-500", icon: <Timer size={14} />, label: "Tarde" },
    falta: { bg: "bg-red-600", icon: <XCircle size={14} />, label: "Falta" },
  };
  const c = configs[type as keyof typeof configs];
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
        active
          ? `${c.bg} text-white border-transparent shadow-md scale-105`
          : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
      }`}
    >
      {c.icon} {c.label}
    </button>
  );
};

const MobileStatusButton = ({ active, type, onClick }: any) => {
  const configs = {
    asistio: { bg: "bg-green-600", icon: <CheckCircle2 size={18} /> },
    tarde: { bg: "bg-amber-500", icon: <Timer size={18} /> },
    falta: { bg: "bg-red-600", icon: <XCircle size={18} /> },
  };
  const c = configs[type as keyof typeof configs];
  return (
    <button
      onClick={onClick}
      className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border-2 ${
        active
          ? `${c.bg} text-white border-transparent shadow-lg`
          : "bg-slate-50 text-slate-300 border-slate-50"
      }`}
    >
      {c.icon}
      <span className="text-[8px] font-black uppercase">{type}</span>
    </button>
  );
};

const InputTime = ({ value, label, onChange }: any) => (
  <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
    <label className="text-[7px] font-black uppercase text-slate-400 block mb-1 tracking-tighter">
      {label}
    </label>
    <input
      type="time"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-none font-black text-[11px] outline-none text-slate-700"
    />
  </div>
);

const InputNumber = ({ value, label, onChange }: any) => (
  <div className="w-16 bg-slate-50 p-2 rounded-xl border border-slate-100">
    <label className="text-[7px] font-black uppercase text-slate-400 block mb-1 tracking-tighter text-center">
      {label}
    </label>
    <input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-transparent border-none font-black text-[11px] outline-none text-center text-slate-700"
    />
  </div>
);

const ResumenItem = ({ label, count, color }: any) => (
  <div className="flex flex-col items-center">
    <span className={`text-[8px] font-black uppercase italic ${color}`}>
      {label}
    </span>
    <span className="text-white font-black text-lg leading-none mt-1">
      {count}
    </span>
  </div>
);
