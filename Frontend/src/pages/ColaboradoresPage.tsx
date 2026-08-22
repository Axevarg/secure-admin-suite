import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Briefcase,
  Clock,
  ChevronRight,
  Building2,
} from "lucide-react";

interface Colaborador {
  id: string;
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
  departamento: string;
  estatus: string;
  fecha_ingreso: string;
  turno: string;
  foto_url: string;
  num_documentos: number;
  telefono: string;
}

interface Departamento {
  id: number;
  nombre: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

const ESTATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  activo: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Activo",
  },
  inactivo: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    dot: "bg-slate-400",
    label: "Inactivo",
  },
  vacaciones: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Vacaciones",
  },
  baja: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Baja",
  },
};

export default function ColaboradoresLista() {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [q, setQ] = useState("");
  const [fEstatus, setFEstatus] = useState("");
  const [fDepto, setFDepto] = useState("");

  const load = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (fEstatus) p.set("estatus", fEstatus);
    if (fDepto) p.set("departamento_id", fDepto);
    api.get(`/colaboradores?${p}`).then((r) => setColaboradores(r.data));
  };

  useEffect(() => {
    api
      .get("/colaboradores/catalogos/departamentos")
      .then((r) => setDepartamentos(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [q, fEstatus, fDepto]);

  const activos = colaboradores.filter((c) => c.estatus === "activo").length;
  const inactivos = colaboradores.filter((c) => c.estatus !== "activo").length;

  const iniciales = (c: Colaborador) =>
    `${c.nombre[0] ?? ""}${c.apellido_paterno[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] p-8 overflow-hidden text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #ef4444 0%, transparent 55%), radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 55%)",
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/50">
                <Users size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Colaboradores 
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Directorio de colaboradores activos e historial
            </p>
          </div>

          {/* STATS RÁPIDOS */}
          <div className="flex gap-3 flex-wrap items-start">
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{activos}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Activos
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-slate-400">{inactivos}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Inactivos
              </p>
            </div>
            <button
              onClick={() => navigate("/colaboradores/nuevo")}
              className="bg-red-600 hover:bg-red-700 h-full min-h-[4rem] px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-900/30 flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> Registrar
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
            size={16}
          />
          <Input
            placeholder="Buscar por nombre, número de empleado o CURP..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11 h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase tracking-wide"
          />
        </div>
        <select
          value={fDepto}
          onChange={(e) => setFDepto(e.target.value)}
          className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-black text-[10px] uppercase outline-none min-w-[180px]"
        >
          <option value="">Todos los departamentos</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <select
          value={fEstatus}
          onChange={(e) => setFEstatus(e.target.value)}
          className="h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-black text-[10px] uppercase outline-none min-w-[150px]"
        >
          <option value="">Todos los estatus</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="vacaciones">Vacaciones</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {colaboradores.map((c) => {
          const est = ESTATUS_CONFIG[c.estatus] ?? ESTATUS_CONFIG.inactivo;
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/colaboradores/${c.id}`)}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden"
            >
              {/* TOP BAR */}
              <div
                className={`h-1.5 w-full ${c.estatus === "activo" ? "bg-emerald-500" : c.estatus === "baja" ? "bg-red-500" : "bg-slate-300"}`}
              />

              <div className="p-6 space-y-4">
                {/* AVATAR + NOMBRE */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {c.foto_url ? (
                      <img
                        src={`${BASE_URL}${c.foto_url}`}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                        {iniciales(c)}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${est.dot}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 inline-flex rounded-lg bg-red-50 px-2.5 py-1">
                      <p className="font-mono text-sm font-black tracking-[0.12em] text-red-600">
                        {c.numero_empleado ?? "Sin número"}
                      </p>
                    </div>
                    <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-tight truncate">
                      {c.nombre} {c.apellido_paterno} {c.apellido_materno}
                    </h2>
                    <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5 truncate">
                      {c.puesto ?? "Sin puesto"}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0"
                  />
                </div>

                {/* INFO */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[9px] font-black text-slate-500 uppercase truncate">
                      {c.departamento ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[9px] font-black text-slate-500 uppercase truncate">
                      {c.turno ?? "—"}
                    </p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between pt-2 gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${est.bg} ${est.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                    {est.label}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">
                      {c.num_documentos} docs
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/colaboradores/${c.id}/editar`);
                      }}
                      className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {colaboradores.length === 0 && (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="font-black text-[10px] uppercase text-slate-300 tracking-widest">
            Sin colaboradores registrados
          </p>
        </div>
      )}
    </div>
  );
}
