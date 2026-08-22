import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import {
  ArrowLeft, User, Briefcase, Clock, CreditCard,
  Phone, FileText, History, Upload, Trash2, X,
  Calendar, Shield, AlertCircle, CheckCircle2,
  HardHat, MapPin, Edit2, UserMinus,
} from "lucide-react";

interface Colaborador {
  id: string;
  numero_empleado?: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_civil?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  departamento?: string;
  puesto?: string;
  fecha_ingreso?: string;
  tipo_contrato?: string;
  turno?: string;
  hora_entrada?: string;
  hora_salida?: string;
  dias_laborales?: string;
  salario_diario?: number;
  forma_pago?: string;
  banco?: string;
  clabe?: string;
  numero_cuenta?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_relacion?: string;
  estatus: string;
  foto_url?: string;
}

interface Documento {
  id: number;
  tipo: string;
  nombre_archivo: string;
  url: string;
  fecha_vencimiento: string;
  created_at: string;
}

interface Historial {
  id: number;
  tipo_cambio: string;
  descripcion: string;
  valor_anterior: string;
  valor_nuevo: string;
  fecha_cambio: string;
  registrado_por_nombre: string;
}

interface Asignacion {
  id: number;
  obra_id: number;
  obra_nombre: string;
  obra_ubicacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  es_activa: boolean;
  porcentaje_dedicacion: number;
  notas: string;
  asignado_por_nombre: string;
}

interface Obra {
  id: number;
  nombre: string;
  ubicacion: string;
  status_id: number;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.100.233:3000";

const TIPOS_DOC = [
  "ine", "curp", "nss", "comprobante_domicilio",
  "acta_nacimiento", "contrato", "carta_recomendacion",
  "comprobante_estudios", "cedula", "otro",
];

const ESTATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  activo:     { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactivo:   { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400" },
  vacaciones: { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  baja:       { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
};

type Tab = "personal" | "laboral" | "pago" | "documentos" | "asignaciones" | "historial";

export default function ColaboradorPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [documentos, setDocumentos]   = useState<Documento[]>([]);
  const [historial, setHistorial]     = useState<Historial[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [obras, setObras]             = useState<Obra[]>([]);
  const [tab, setTab]                 = useState<Tab>("personal");

  // Doc upload
  const [tipoDoc, setTipoDoc]         = useState("ine");
  const [vencimiento, setVencimiento] = useState("");
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Estatus modal
  const [openEstatus, setOpenEstatus] = useState(false);
  const [nuevoEstatus, setNuevoEstatus] = useState("");
  const [motivoBaja, setMotivoBaja]   = useState("");

  // Asignación modal
  const [openAsignacion, setOpenAsignacion] = useState(false);
  const [asigForm, setAsigForm] = useState({
    obra_id: "",
    fecha_inicio: new Date().toISOString().split("T")[0],
    porcentaje_dedicacion: "100",
    notas: "",
  });
  const [savingAsig, setSavingAsig] = useState(false);

  const load = () =>
    api.get(`/colaboradores/${id}`).then((r) => {
      setColaborador(r.data.colaborador);
      setDocumentos(r.data.documentos);
      setHistorial(r.data.historial);
    });

  const loadAsignaciones = () =>
    api.get(`/colaboradores/${id}/asignaciones`).then((r) => setAsignaciones(r.data));

  useEffect(() => {
    load();
    loadAsignaciones();
    api.get("/obras").then((r) => setObras(r.data));
  }, [id]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const form = new FormData();
      form.append("file", file);
      form.append("colaborador_id", id!);
      form.append("tipo", tipoDoc);
      form.append("usuario_id", user.id ?? "");
      if (vencimiento) form.append("fecha_vencimiento", vencimiento);
      await api.post("/colaboradores/documentos/subir", form);
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const eliminarDoc = async (docId: number) => {
    if (!confirm("¿Eliminar documento?")) return;
    await api.delete(`/colaboradores/documentos/${docId}`);
    load();
  };

  const cambiarEstatus = async () => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    await api.patch(`/colaboradores/${id}/estatus`, {
      estatus: nuevoEstatus,
      motivo: motivoBaja,
      usuario_id: user.id,
    });
    setOpenEstatus(false);
    load();
  };

  const handleAsignar = async () => {
    if (!asigForm.obra_id) return alert("Selecciona una obra");
    setSavingAsig(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      await api.post(`/colaboradores/${id}/asignar`, {
        ...asigForm,
        obra_id: Number(asigForm.obra_id),
        porcentaje_dedicacion: Number(asigForm.porcentaje_dedicacion),
        usuario_id: user.id,
      });
      setOpenAsignacion(false);
      setAsigForm({
        obra_id: "",
        fecha_inicio: new Date().toISOString().split("T")[0],
        porcentaje_dedicacion: "100",
        notas: "",
      });
      loadAsignaciones();
      load(); // refresca historial también
    } finally {
      setSavingAsig(false);
    }
  };

  const handleDesasignar = async () => {
    if (!confirm("¿Quitar al colaborador de su obra actual?")) return;
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    await api.patch(`/colaboradores/${id}/desasignar`, { usuario_id: user.id });
    loadAsignaciones();
  };

  if (!colaborador) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const est = ESTATUS_CONFIG[colaborador.estatus] ?? ESTATUS_CONFIG.inactivo;
  const iniciales = `${colaborador.nombre[0] ?? ""}${colaborador.apellido_paterno[0] ?? ""}`.toUpperCase();
  const asignacionActiva = asignaciones.find((a) => a.es_activa);

  const TABS: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: "personal",     label: "Personal",     icon: <User size={14} /> },
    { key: "laboral",      label: "Laboral",      icon: <Briefcase size={14} /> },
    { key: "pago",         label: "Pago",         icon: <CreditCard size={14} /> },
    { key: "documentos",   label: "Documentos",   icon: <FileText size={14} /> },
    { key: "asignaciones", label: "Obra Actual",  icon: <HardHat size={14} /> },
    { key: "historial",    label: "Historial",    icon: <History size={14} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER PERFIL */}
      <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 90% 50%, #ef4444 0%, transparent 60%)" }} />

        <div className="relative z-10 p-8">
          <button
            onClick={() => navigate("/colaboradores")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-black text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Volver al directorio
          </button>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* FOTO */}
            <div className="relative shrink-0">
              {colaborador.foto_url ? (
                <img src={`${BASE_URL}${colaborador.foto_url}`}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black border-4 border-white/10">
                  {iniciales}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${est.dot}`} />
            </div>

            {/* DATOS */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter">
                  {colaborador.nombre} {colaborador.apellido_paterno} {colaborador.apellido_materno}
                </h1>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${est.bg} ${est.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                  {colaborador.estatus}
                </div>
              </div>
              <p className="text-red-400 font-black text-sm uppercase">
                {colaborador.puesto ?? "Sin puesto"} · {colaborador.departamento ?? "Sin departamento"}
              </p>

              {/* OBRA ACTUAL — badge visible en el header */}
              {asignacionActiva ? (
                <div className="flex items-center gap-2 mt-2 bg-white/10 rounded-xl px-3 py-1.5 w-fit">
                  <HardHat size={12} className="text-amber-400" />
                  <p className="text-[10px] font-black uppercase text-amber-300">
                    {asignacionActiva.obra_nombre}
                  </p>
                  {asignacionActiva.porcentaje_dedicacion < 100 && (
                    <span className="bg-amber-400/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                      {asignacionActiva.porcentaje_dedicacion}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 bg-white/5 rounded-xl px-3 py-1.5 w-fit">
                  <HardHat size={12} className="text-slate-500" />
                  <p className="text-[10px] font-black uppercase text-slate-500">Sin obra asignada</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-3 text-slate-400 text-[10px] font-bold uppercase">
                {colaborador.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {colaborador.telefono}
                  </span>
                )}
                {colaborador.fecha_ingreso && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Ingreso: {new Date(colaborador.fecha_ingreso).toLocaleDateString("es-MX")}
                  </span>
                )}
                {colaborador.tipo_contrato && (
                  <span className="flex items-center gap-1">
                    <Shield size={11} /> {colaborador.tipo_contrato}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => navigate(`/colaboradores/${id}/editar`)}
                className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button
                onClick={() => { setNuevoEstatus(colaborador.estatus); setOpenEstatus(true); }}
                className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Cambiar Estatus
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="relative z-10 flex gap-1 px-8 pb-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 font-black text-[10px] uppercase tracking-widest transition-all rounded-t-xl whitespace-nowrap ${
                tab === t.key
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {t.icon} {t.label}
              {t.key === "documentos" && documentos.length > 0 && (
                <span className="bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                  {documentos.length}
                </span>
              )}
              {t.key === "asignaciones" && asignacionActiva && (
                <span className="bg-amber-500 text-white text-[8px] w-2 h-2 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">

        {/* ── PERSONAL ── */}
        {tab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Nombre completo", value: `${colaborador.nombre} ${colaborador.apellido_paterno} ${colaborador.apellido_materno ?? ""}` },
              { label: "Fecha de nacimiento", value: colaborador.fecha_nacimiento ? new Date(colaborador.fecha_nacimiento).toLocaleDateString("es-MX") : "—" },
              { label: "Sexo", value: colaborador.sexo },
              { label: "Estado civil", value: colaborador.estado_civil },
              { label: "Número de empleado", value: colaborador.numero_empleado, mono: true },
              { label: "CURP", value: colaborador.curp, mono: true },
              { label: "RFC", value: colaborador.rfc, mono: true },
              { label: "NSS", value: colaborador.nss, mono: true },
              { label: "Teléfono", value: colaborador.telefono },
              { label: "Email", value: colaborador.email },
              { label: "Dirección", value: colaborador.direccion, full: true },
            ].map((f) => (
              <div key={f.label} className={`space-y-1 ${f.full ? "md:col-span-2" : ""}`}>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{f.label}</p>
                <p className={`font-bold text-slate-800 text-sm ${f.mono ? "font-mono tracking-wider" : "uppercase"}`}>
                  {f.value ?? "—"}
                </p>
              </div>
            ))}
            <div className="md:col-span-2 mt-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={12} /> Contacto de Emergencia
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Nombre", value: colaborador.contacto_emergencia_nombre },
                  { label: "Teléfono", value: colaborador.contacto_emergencia_telefono },
                  { label: "Relación", value: colaborador.contacto_emergencia_relacion },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{f.label}</p>
                    <p className="font-bold text-slate-800 text-sm uppercase">{f.value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LABORAL ── */}
        {tab === "laboral" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Departamento", value: colaborador.departamento },
              { label: "Puesto", value: colaborador.puesto },
              { label: "Fecha de ingreso", value: colaborador.fecha_ingreso ? new Date(colaborador.fecha_ingreso).toLocaleDateString("es-MX") : "—" },
              { label: "Tipo de contrato", value: colaborador.tipo_contrato },
              { label: "Turno", value: colaborador.turno },
              { label: "Días laborales", value: colaborador.dias_laborales },
              { label: "Hora entrada", value: colaborador.hora_entrada },
              { label: "Hora salida", value: colaborador.hora_salida },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{f.label}</p>
                <p className="font-bold text-slate-800 text-sm uppercase">{f.value ?? "—"}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── PAGO ── */}
        {tab === "pago" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Salario Diario</p>
                <p className="text-3xl font-black mt-1">
                  ${(colaborador.salario_diario ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Mensual aprox.</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  ${((colaborador.salario_diario ?? 0) * 24).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {[
              { label: "Forma de pago", value: colaborador.forma_pago },
              { label: "Banco", value: colaborador.banco },
              { label: "CLABE", value: colaborador.clabe, mono: true },
              { label: "Número de cuenta", value: colaborador.numero_cuenta, mono: true },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{f.label}</p>
                <p className={`font-bold text-slate-800 text-sm ${f.mono ? "font-mono tracking-wider" : "uppercase"}`}>
                  {f.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab === "documentos" && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                <Upload size={12} /> Subir nuevo documento
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 font-black text-[10px] uppercase outline-none">
                  {TIPOS_DOC.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Vencimiento (opcional)</p>
                  <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 font-bold text-xs outline-none" />
                </div>
                <label className={`h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all ${
                  uploading ? "bg-slate-300 text-slate-500" : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                }`}>
                  <Upload size={14} />
                  {uploading ? "Subiendo..." : "Seleccionar archivo"}
                  <input ref={fileRef} type="file" accept="image/*,application/pdf"
                    className="hidden" onChange={handleDocUpload} />
                </label>
              </div>
            </div>

            {documentos.length === 0 ? (
              <p className="text-center py-10 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                Sin documentos cargados
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentos.map((doc) => {
                  const vencido = doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date();
                  return (
                    <div key={doc.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        vencido ? "border-red-200 bg-red-50" : "border-slate-100 bg-white hover:border-slate-200"
                      }`}>
                      <div className={`p-3 rounded-xl shrink-0 ${vencido ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[10px] uppercase text-red-600 tracking-widest">
                          {doc.tipo.replace("_", " ")}
                        </p>
                        <p className="font-bold text-xs text-slate-700 truncate">{doc.nombre_archivo}</p>
                        {doc.fecha_vencimiento && (
                          <p className={`text-[9px] font-black uppercase mt-0.5 flex items-center gap-1 ${vencido ? "text-red-600" : "text-slate-400"}`}>
                            {vencido ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                            Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString("es-MX")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={`${BASE_URL}${doc.url}`} target="_blank" rel="noreferrer"
                          className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                          <FileText size={14} />
                        </a>
                        <button onClick={() => eliminarDoc(doc.id)}
                          className="p-2 bg-slate-100 hover:bg-red-600 hover:text-white rounded-xl transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ASIGNACIONES ── */}
        {tab === "asignaciones" && (
          <div className="space-y-6">
            {/* ASIGNACIÓN ACTIVA */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500">
                    Obra Actual
                  </h3>
                </div>
                <div className="flex gap-2">
                  {asignacionActiva && (
                    <button
                      onClick={handleDesasignar}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors"
                    >
                      <UserMinus size={12} /> Desasignar
                    </button>
                  )}
                  <button
                    onClick={() => setOpenAsignacion(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors shadow-lg shadow-amber-900/20"
                  >
                    <HardHat size={12} />
                    {asignacionActiva ? "Reasignar" : "Asignar a obra"}
                  </button>
                </div>
              </div>

              {asignacionActiva ? (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-900/20">
                        <HardHat size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                          {asignacionActiva.obra_nombre}
                        </h2>
                        {asignacionActiva.obra_ubicacion && (
                          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {asignacionActiva.obra_ubicacion}
                          </p>
                        )}
                        <p className="text-[9px] font-bold text-amber-600 uppercase mt-1 flex items-center gap-1">
                          <Calendar size={10} />
                          Desde: {new Date(asignacionActiva.fecha_inicio).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dedicación</p>
                      <p className="text-3xl font-black text-amber-600 mt-1">
                        {asignacionActiva.porcentaje_dedicacion}%
                      </p>
                    </div>
                  </div>

                  {asignacionActiva.notas && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Notas</p>
                      <p className="text-xs font-bold text-slate-600">{asignacionActiva.notas}</p>
                    </div>
                  )}

                  {asignacionActiva.asignado_por_nombre && (
                    <p className="text-[9px] font-black uppercase text-slate-400 mt-3">
                      Asignado por: {asignacionActiva.asignado_por_nombre}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <HardHat size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest">
                    Sin obra asignada actualmente
                  </p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">
                    Usa el botón "Asignar a obra" para agregarlo a un proyecto
                  </p>
                </div>
              )}
            </div>

            {/* HISTORIAL DE ASIGNACIONES */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-slate-300 rounded-full" />
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400">
                  Historial de Obras ({asignaciones.filter((a) => !a.es_activa).length})
                </h3>
              </div>

              {asignaciones.filter((a) => !a.es_activa).length === 0 ? (
                <p className="text-center py-8 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                  Sin historial de asignaciones anteriores
                </p>
              ) : (
                <div className="space-y-3">
                  {asignaciones
                    .filter((a) => !a.es_activa)
                    .map((a) => (
                      <div key={a.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="bg-slate-200 p-2.5 rounded-xl shrink-0">
                          <HardHat size={16} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs text-slate-700 uppercase truncate">
                            {a.obra_nombre}
                          </p>
                          {a.obra_ubicacion && (
                            <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <MapPin size={9} /> {a.obra_ubicacion}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] font-black uppercase text-slate-400">
                            {new Date(a.fecha_inicio).toLocaleDateString("es-MX")}
                            {a.fecha_fin && ` → ${new Date(a.fecha_fin).toLocaleDateString("es-MX")}`}
                          </p>
                          <p className="text-[9px] font-black text-slate-300 uppercase">
                            {a.porcentaje_dedicacion}% dedicación
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === "historial" && (
          <div className="space-y-3">
            {historial.length === 0 ? (
              <p className="text-center py-10 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                Sin registros en el historial
              </p>
            ) : historial.map((h) => (
              <div key={h.id} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-black text-[10px] uppercase text-red-600 tracking-widest">
                      {h.tipo_cambio?.replace("_", " ")}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold shrink-0">
                      {new Date(h.fecha_cambio).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  {h.descripcion && (
                    <p className="text-xs font-bold text-slate-600 mt-0.5">{h.descripcion}</p>
                  )}
                  {(h.valor_anterior || h.valor_nuevo) && (
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                      {h.valor_anterior} → {h.valor_nuevo}
                    </p>
                  )}
                  {h.registrado_por_nombre && (
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">
                      Por: {h.registrado_por_nombre}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CAMBIAR ESTATUS */}
      {openEstatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpenEstatus(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h2 className="font-black text-lg uppercase tracking-tighter">
                Cambiar <span className="text-red-500">Estatus</span>
              </h2>
              <button onClick={() => setOpenEstatus(false)}
                className="bg-white/10 hover:bg-red-600 p-2 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {["activo", "inactivo", "vacaciones", "baja"].map((s) => {
                  const ec = ESTATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => setNuevoEstatus(s)}
                      className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                        nuevoEstatus === s ? `${ec.bg} ${ec.text} border-current` : "bg-slate-50 text-slate-400 border-transparent"
                      }`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Motivo / Observación
                </label>
                <textarea value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)}
                  rows={3} placeholder="Describe el motivo del cambio..."
                  className="w-full mt-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-xs resize-none outline-none focus:ring-2 focus:ring-red-600/10" />
              </div>
              <button onClick={cambiarEstatus}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-colors shadow-lg shadow-red-900/20">
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR OBRA */}
      {openAsignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpenAsignacion(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {asignacionActiva ? "Reasignar colaborador" : "Nueva asignación"}
                </span>
                <h2 className="font-black text-lg uppercase tracking-tighter mt-1">
                  Asignar a <span className="text-amber-200">Obra</span>
                </h2>
              </div>
              <button onClick={() => setOpenAsignacion(false)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {asignacionActiva && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[9px] font-black uppercase text-amber-700 flex items-center gap-2">
                  <AlertCircle size={12} />
                  Se cerrará la asignación actual en {asignacionActiva.obra_nombre}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Obra *
                </label>
                <select value={asigForm.obra_id}
                  onChange={(e) => setAsigForm({ ...asigForm, obra_id: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-amber-500/20">
                  <option value="">Seleccionar obra...</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Fecha de inicio
                  </label>
                  <input type="date" value={asigForm.fecha_inicio}
                    onChange={(e) => setAsigForm({ ...asigForm, fecha_inicio: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    % Dedicación
                  </label>
                  <input type="number" min="1" max="100"
                    value={asigForm.porcentaje_dedicacion}
                    onChange={(e) => setAsigForm({ ...asigForm, porcentaje_dedicacion: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 font-black text-sm outline-none focus:ring-2 focus:ring-amber-500/20" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Notas
                </label>
                <textarea value={asigForm.notas}
                  onChange={(e) => setAsigForm({ ...asigForm, notas: e.target.value })}
                  rows={2} placeholder="Motivo de asignación, condiciones especiales..."
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-xs resize-none outline-none focus:ring-2 focus:ring-amber-500/20" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setOpenAsignacion(false)}
                  className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleAsignar} disabled={savingAsig}
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-amber-900/20">
                  {savingAsig ? "Asignando..." : "Confirmar asignación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
