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
  Clock3,
  Users,
  MapPin,
  Lock,
  ScanFace,
  Hand,
} from "lucide-react";

interface TrabajadorRow {
  trabajador_id: number;
  nombre: string;
  estado?: "asistio" | "tarde" | "falta";
  hora_entrada?: string | null;
  hora_salida?: string | null;
  horas_trabajadas?: number;
  horas_extra?: number;
  justificacion?: string | null;
  metodo_entrada?: "facial" | "manual" | null;
  metodo_salida?: "facial" | "manual" | null;
  lat_entrada?: number | null;
  lng_entrada?: number | null;
  precision_entrada?: number | null;
  lat_salida?: number | null;
  lng_salida?: number | null;
  precision_salida?: number | null;
  direccion_entrada?: string | null;
  direccion_salida?: string | null;
}

type EstadoDia = "asistio" | "tarde" | "falta" | "pendiente";

// La asistencia la registra la app móvil con reconocimiento facial;
// aquí solo se muestra y se agrega una justificación.
const estadoDe = (t: TrabajadorRow, diaCerrado: boolean): EstadoDia => {
  if (t.hora_entrada || t.hora_salida) {
    return t.estado === "tarde" ? "tarde" : "asistio";
  }
  return t.estado === "falta" || diaCerrado ? "falta" : "pendiente";
};

const formatoHora = (hora?: string | null) => (hora ? hora.slice(0, 5) : "--:--");

interface MarcaRow {
  id: number;
  trabajador_id: number;
  nombre: string;
  tipo: "entrada" | "salida";
  metodo: "facial" | "manual";
  hora: string;
  lat: number | null;
  lng: number | null;
  precision_m: number | null;
  direccion: string | null;
  estado: "aplicada" | "dia_cerrado" | "no_asignado";
}

const ESTADO_MARCA: Record<MarcaRow["estado"], string> = {
  aplicada: "Aplicada",
  dia_cerrado: "Día cerrado",
  no_asignado: "No asignado",
};

const today = new Date().toISOString().slice(0, 10);

export default function AsistenciaPage() {
  const { id } = useParams();
  const [obra, setObra] = useState<any>(null);
  const [fecha, setFecha] = useState(today);
  const [rows, setRows] = useState<TrabajadorRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marcas, setMarcas] = useState<MarcaRow[]>([]);
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
      setRows(
        res.data.map((registro: TrabajadorRow) => ({
          ...registro,
          horas_extra: Number(registro.horas_extra || 0),
          horas_trabajadas: Number(registro.horas_trabajadas || 0),
          justificacion: registro.justificacion || "",
        })),
      );
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

  // Marcas de la app móvil del día, con su ubicación GPS
  const loadMarcas = async () => {
    try {
      const res = await api.get(`/asistencias/obra/${id}/marcas?fecha=${fecha}`);
      setMarcas(res.data);
    } catch (err) {
      console.error("Error al cargar marcas:", err);
      setMarcas([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadData();
    verificarCierre();
    loadMarcas();
  }, [fecha, id]);

  // Lógica de filtrado en tiempo real
  const filteredRows = rows.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Actualización por ID para que el buscador no afecte los índices
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
      await api.post("/asistencias/justificaciones", {
        obra_id: id,
        fecha,
        justificaciones: rows
          .filter((r) => (r.justificacion || "").trim() !== "")
          .map((r) => ({
            trabajador_id: r.trabajador_id,
            justificacion: r.justificacion,
          })),
      });
      alert("Justificaciones guardadas ✔");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar justificaciones");
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SIGO */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
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
          {/* El día se cierra solo al pasar la medianoche */}
          {!diaCerrado ? (
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
          ) : (
            <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 px-4">
              <Lock size={14} /> Día cerrado
            </span>
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

      {/* ===================== DASHBOARD DEL DÍA ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <Users className="text-slate-700" size={24} />
          </div>

          <p className="text-3xl font-black text-slate-900">{rows.length}</p>

          <p className="mt-2 text-[10px] uppercase font-black tracking-[0.25em] text-slate-500">
            Trabajadores
          </p>

          <span className="text-[11px] text-slate-400 font-bold">
            Registrados
          </span>
        </div>

        {/* Asistieron */}
        <div className="bg-white rounded-[2rem] border border-green-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="text-green-600" size={24} />
          </div>

          <p className="text-3xl font-black text-green-600">
            {rows.filter((r) => estadoDe(r, diaCerrado) === "asistio").length}
          </p>

          <p className="mt-2 text-[10px] uppercase font-black tracking-[0.25em] text-green-700">
            Asistieron
          </p>

          <span className="text-[11px] text-slate-400 font-bold">
            {rows.length
              ? Math.round(
                  (rows.filter((r) => estadoDe(r, diaCerrado) === "asistio").length /
                    rows.length) *
                    100,
                )
              : 0}
            % del personal
          </span>
        </div>

        {/* Tarde */}
        <div className="bg-white rounded-[2rem] border border-amber-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
            <Timer className="text-amber-500" size={24} />
          </div>

          <p className="text-3xl font-black text-amber-500">
            {rows.filter((r) => estadoDe(r, diaCerrado) === "tarde").length}
          </p>

          <p className="mt-2 text-[10px] uppercase font-black tracking-[0.25em] text-amber-600">
            Tardanzas
          </p>

          <span className="text-[11px] text-slate-400 font-bold">
            Llegadas tarde
          </span>
        </div>

        {/* Faltas */}
        <div className="bg-white rounded-[2rem] border border-red-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
            <XCircle className="text-red-600" size={24} />
          </div>

          <p className="text-3xl font-black text-red-600">
            {rows.filter((r) => estadoDe(r, diaCerrado) === "falta").length}
          </p>

          <p className="mt-2 text-[10px] uppercase font-black tracking-[0.25em] text-red-600">
            Faltas
          </p>

          <span className="text-[11px] text-slate-400 font-bold">
            Ausencias del día
          </span>
        </div>

        {/* Horas Extra */}
        <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
            <Clock3 className="text-blue-600" size={24} />
          </div>

          <p className="text-3xl font-black text-blue-600">
            {rows
              .reduce((total, registro) => {
                return total + Number(registro.horas_extra || 0);
              }, 0)
              .toLocaleString("es-MX", { maximumFractionDigits: 2 })}
          </p>

          <p className="mt-2 text-[10px] uppercase font-black tracking-[0.25em] text-blue-700">
            Horas Extra
          </p>

          <span className="text-[11px] text-slate-400 font-bold">
            Acumuladas
          </span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y ACCIONES */}
      <div className="max-w-8xl mx-auto flex flex-col md:flex-row gap-4 items-stretch">
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

      <div className="max-w-8xl mx-auto">
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
                  Entrada / Salida / Horas
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Justificación
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
                    <div className="flex justify-center">
                      <EstadoBadge estado={estadoDe(t, diaCerrado)} />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <Marcas t={t} />
                  </td>
                  <td className="px-8 py-5">
                    <JustificacionInput
                      value={t.justificacion}
                      disabled={diaCerrado}
                      onChange={(v: string) =>
                        updateField(t.trabajador_id, "justificacion", v)
                      }
                    />
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
                  className={`w-2 h-8 rounded-full ${estadoDe(t, diaCerrado) === "asistio" ? "bg-green-500" : estadoDe(t, diaCerrado) === "tarde" ? "bg-amber-500" : estadoDe(t, diaCerrado) === "falta" ? "bg-red-600" : "bg-slate-200"}`}
                />
                <h3 className="font-black text-slate-900 uppercase text-base tracking-tight">
                  {t.nombre}
                </h3>
              </div>

              <div className="flex items-center justify-between gap-3">
                <EstadoBadge estado={estadoDe(t, diaCerrado)} />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                <Marcas t={t} />
              </div>

              <JustificacionInput
                value={t.justificacion}
                disabled={diaCerrado}
                onChange={(v: string) =>
                  updateField(t.trabajador_id, "justificacion", v)
                }
              />
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

        {/* MARCAS DE LA APP CON UBICACIÓN */}
        <div className="mt-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
            <MapPin size={18} className="text-red-600" />
            <h2 className="font-black uppercase text-sm tracking-tight text-slate-900">
              Marcas de la app ({marcas.length})
            </h2>
          </div>
          {marcas.length === 0 ? (
            <p className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Sin marcas de la app en esta fecha
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {["Hora", "Trabajador", "Tipo", "Método", "Estado", "Ubicación"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {marcas.map((m) => (
                    <tr key={m.id} className="text-[11px] font-bold text-slate-700">
                      <td className="px-6 py-3">{formatoHora(m.hora)}</td>
                      <td className="px-6 py-3 uppercase">{m.nombre}</td>
                      <td className="px-6 py-3 capitalize">{m.tipo}</td>
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-1">
                          <MetodoIcono metodo={m.metodo} />
                          {m.metodo === "facial" ? "Rostro" : "Manual"}
                        </span>
                      </td>
                      <td className="px-6 py-3">{ESTADO_MARCA[m.estado] ?? m.estado}</td>
                      <td className="px-6 py-3">
                        {m.lat != null && m.lng != null ? (
                          <>
                          <a
                            href={`https://www.google.com/maps?q=${m.lat},${m.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-red-600 hover:underline"
                          >
                            <MapPin size={12} /> Ver en mapa
                            {m.precision_m != null && (
                              <span className="text-slate-400">
                                (±{Math.round(m.precision_m)} m)
                              </span>
                            )}
                          </a>
                          {m.direccion && (
                            <span className="block text-[10px] font-semibold text-slate-400 mt-1">
                              {m.direccion}
                            </span>
                          )}
                          </>
                        ) : (
                          <span className="text-slate-300">Sin ubicación</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

const EstadoBadge = ({ estado }: { estado: EstadoDia }) => {
  const configs = {
    asistio: {
      cls: "bg-green-600 text-white",
      icon: <CheckCircle2 size={14} />,
      label: "Asistió",
    },
    tarde: {
      cls: "bg-amber-500 text-white",
      icon: <Timer size={14} />,
      label: "Tarde",
    },
    falta: {
      cls: "bg-red-600 text-white",
      icon: <XCircle size={14} />,
      label: "Falta",
    },
    pendiente: {
      cls: "bg-slate-100 text-slate-400",
      icon: <Clock3 size={14} />,
      label: "Sin marca",
    },
  };
  const c = configs[estado];
  return (
    <span
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${c.cls}`}
    >
      {c.icon} {c.label}
    </span>
  );
};

const MetodoIcono = ({ metodo }: { metodo?: string | null }) =>
  metodo === "facial" ? (
    <ScanFace size={12} className="text-green-600" aria-label="Reconocimiento facial" />
  ) : metodo === "manual" ? (
    <Hand size={12} className="text-slate-400" aria-label="Manual" />
  ) : null;

// Enlace a Google Maps con la ubicación GPS de la marca
const UbicacionLink = ({ lat, lng, precision }: any) =>
  lat != null && lng != null ? (
    <a
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      title={
        precision != null
          ? `Ver en mapa (±${Math.round(precision)} m)`
          : "Ver en mapa"
      }
      className="text-red-600 hover:text-red-800"
    >
      <MapPin size={12} />
    </a>
  ) : null;

const Marcas = ({ t }: { t: TrabajadorRow }) => (
  <div className="flex gap-3">
    <DatoLectura label="Entrada">
      {formatoHora(t.hora_entrada)}
      {t.hora_entrada && <MetodoIcono metodo={t.metodo_entrada} />}
      {t.hora_entrada && (
        <UbicacionLink
          lat={t.lat_entrada}
          lng={t.lng_entrada}
          precision={t.precision_entrada}
        />
      )}
      {t.hora_entrada && <Direccion texto={t.direccion_entrada} />}
    </DatoLectura>
    <DatoLectura label="Salida">
      {formatoHora(t.hora_salida)}
      {t.hora_salida && <MetodoIcono metodo={t.metodo_salida} />}
      {t.hora_salida && (
        <UbicacionLink
          lat={t.lat_salida}
          lng={t.lng_salida}
          precision={t.precision_salida}
        />
      )}
      {t.hora_salida && <Direccion texto={t.direccion_salida} />}
    </DatoLectura>
    <DatoLectura label="Horas">
      {Number(t.horas_trabajadas || 0).toLocaleString("es-MX", {
        maximumFractionDigits: 2,
      })}
    </DatoLectura>
  </div>
);

const DatoLectura = ({ label, children }: any) => (
  <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
    <span className="text-[7px] font-black uppercase text-slate-400 block mb-1 tracking-tighter">
      {label}
    </span>
    <span className="flex flex-wrap items-center gap-1 font-black text-[11px] text-slate-700">
      {children}
    </span>
  </div>
);

// Dirección en texto calculada por el backend a partir del GPS de la marca
const Direccion = ({ texto }: { texto?: string | null }) =>
  texto ? (
    <span className="basis-full text-[9px] font-semibold text-slate-400 leading-tight">
      {texto}
    </span>
  ) : null;

const JustificacionInput = ({ value, disabled, onChange }: any) => (
  <textarea
    value={value || ""}
    disabled={disabled}
    maxLength={500}
    rows={2}
    placeholder={disabled ? "" : "Agregar justificación..."}
    onChange={(e) => onChange(e.target.value)}
    className="w-full min-w-[220px] bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 outline-none focus:border-red-300 resize-none disabled:opacity-60"
  />
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
