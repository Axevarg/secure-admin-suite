import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  History,
  UploadCloud,
  FileCheck2,
  Loader2,
  Receipt,
  CreditCard,
  Pencil,
} from "lucide-react";

interface Req {
  id: number;
  folio: string;
  obra: string;
  solicitado_por: string;
  fecha_envio: string;
  estado: string;
  cotizacion_url?: string | null;
  cotizacion_subida_at?: string | null;
  requiere_factura?: boolean | null;
  forma_pago?: string | null;
  condiciones_pago?: string | null;
}

interface Detalle {
  id: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  fecha_requerida: string;
}

type TabKey = "pendientes" | "aprobadas" | "cotizadas" | "rechazadas";

// Lee los permisos del usuario guardados en sessionStorage (mismo patrón usado en Obras)
function getPermisos(): string[] {
  try {
    return JSON.parse(
      sessionStorage.getItem("permissions") ||
      localStorage.getItem("permissions") ||
      "[]"
    );
  } catch {
    return [];
  }
}

const ARCHIVOS_PERMITIDOS = [".pdf", ".jpg", ".jpeg", ".png"];
const TAMANO_MAX = 10 * 1024 * 1024; // 10MB

export default function AprobacionesPage() {
  const permisos = useMemo(() => getPermisos(), []);
  const hasAprobar = permisos.includes("aprobaciones:approve");
  console.log("PERMISOS:", permisos);
console.log("BUSCANDO:", "aprobaciones:approve");
console.log("HAS APROBAR:", hasAprobar);
console.log(
  "PERMISO ENCONTRADO:",
  permisos.find((p) => p.includes("aprobaciones"))
);

  const [requisiciones, setRequisiciones] = useState<Req[]>([]);
  const [open, setOpen] = useState(false);
  const [requisicion, setRequisicion] = useState<any>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);

  // Si no tiene permiso de aprobar, la pestaña queda fija en "aprobadas"
  const [tab, setTab] = useState<TabKey>(
    hasAprobar ? "pendientes" : "aprobadas",
  );

  // Estados para búsqueda y filtrado
  const [search, setSearch] = useState("");
  const [filtroObra, setFiltroObra] = useState("");

  // --- Modal de cotización (crear o editar) ---
  const [cotizarOpen, setCotizarOpen] = useState(false);
  const [cotizarTarget, setCotizarTarget] = useState<Req | null>(null);
  const [archivoCotizacion, setArchivoCotizacion] = useState<File | null>(null);
  const [requiereFactura, setRequiereFactura] = useState<"true" | "false" | "">(
    "",
  );
  const [formaPago, setFormaPago] = useState<"contado" | "credito" | "">("");
  const [condicionesPago, setCondicionesPago] = useState("");
  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);

  const loadData = async (tabActual: TabKey = tab) => {
    // Blindaje adicional: sin permiso de aprobar, nunca se consulta otra pestaña
    const tabSegura: TabKey = hasAprobar
      ? tabActual
      : tabActual === "aprobadas" || tabActual === "cotizadas"
        ? tabActual
        : "aprobadas";
    setLoading(true);
    try {
      const { data } = await api.get(`/validacion-requisiciones/${tabSegura}`);
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
  const requisicionesFiltradas = requisiciones.filter((r) => {
    const matchesSearch =
      (r.folio || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.solicitado_por || "").toLowerCase().includes(search.toLowerCase());
    const matchesObra = filtroObra === "" || r.obra === filtroObra;
    return matchesSearch && matchesObra;
  });

  // Obtener obras únicas para el select del filtro
  const obrasUnicas = Array.from(new Set(requisiciones.map((r) => r.obra)));

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

  const getCotizacionUrl = (url?: string | null) => {
    if (!url) return null;

    // Si ya es una URL completa, la usamos directamente
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Si viene como /uploads/...
    const baseURL = api.defaults.baseURL || "";

    return `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };

  const autorizar = async () => {
    if (!hasAprobar) return; // blindaje: nunca debería llegar aquí sin permiso
    if (!confirm("¿Confirmar autorización de esta requisición?")) return;
    await api.put(`/validacion-requisiciones/${requisicion.id}/autorizar`);
    cerrarModal();
    loadData();
  };

  const rechazar = async () => {
    if (!hasAprobar) return; // blindaje: nunca debería llegar aquí sin permiso
    if (!motivo) return alert("Por favor, especifica el motivo del rechazo");
    await api.put(`/validacion-requisiciones/${requisicion.id}/rechazar`, {
      motivo,
    });
    cerrarModal();
    loadData();
  };

  // --- Cotizar (autorizada -> cotizada), también sirve para editar una cotización existente ---
  const abrirCotizar = (r: Req) => {
    if (!hasAprobar) return;
    setCotizarTarget(r);
    setArchivoCotizacion(null);
    setRequiereFactura(
      r.requiere_factura === true
        ? "true"
        : r.requiere_factura === false
          ? "false"
          : "",
    );
    setFormaPago((r.forma_pago as "contado" | "credito") || "");
    setCondicionesPago(r.condiciones_pago || "");
    setCotizarOpen(true);
  };

  const cerrarCotizar = () => {
    setCotizarOpen(false);
    setCotizarTarget(null);
    setArchivoCotizacion(null);
    setRequiereFactura("");
    setFormaPago("");
    setCondicionesPago("");
  };

  const onSeleccionarArchivoCotizacion = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ARCHIVOS_PERMITIDOS.includes(ext)) {
      alert("Formato no permitido. Solo se aceptan PDF, JPG o PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > TAMANO_MAX) {
      alert("El archivo supera el límite de 10MB.");
      e.target.value = "";
      return;
    }
    setArchivoCotizacion(file);
  };

  const guardarCotizacion = async () => {
    if (!cotizarTarget) return;
    if (!formaPago) return alert("Selecciona la forma de pago");
    if (!requiereFactura)
      return alert("Indica si la requisición requiere factura");

    const esNueva = !cotizarTarget.cotizacion_url;
    if (esNueva && !archivoCotizacion)
      return alert("Adjunta el archivo de la cotización");

    const formData = new FormData();
    if (archivoCotizacion) formData.append("cotizacion", archivoCotizacion);
    formData.append("requiere_factura", requiereFactura);
    formData.append("forma_pago", formaPago);
    formData.append("condiciones_pago", condicionesPago);

    setGuardandoCotizacion(true);
    try {
      await api.post(
        `/validacion-requisiciones/${cotizarTarget.id}/cotizacion`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const idCotizado = cotizarTarget.id;
      await loadData();
      cerrarCotizar();
      // Si el modal de detalle está viendo esta misma requisición, refrescamos su info
      if (requisicion?.id === idCotizado) {
        abrirModal(idCotizado);
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message || "No se pudo guardar la cotización",
      );
    } finally {
      setGuardandoCotizacion(false);
    }
  };

  // Puede ver el motivo de rechazo (dato ya guardado) siempre; puede escribirlo solo si aprueba
  const puedeVerAccionesModal = hasAprobar && requisicion?.estado === "enviada";

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      {/* HEADER SIGO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <CheckCircle size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Bandeja de Aprobaciones
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {tab === "pendientes" && "Requisiciones pendientes de autorización"}
            {tab === "aprobadas" && "Autorizadas, pendientes de cotizar"}
            {tab === "cotizadas" &&
              "Requisiciones cotizadas, listas para compra"}
            {tab === "rechazadas" && "Requisiciones rechazadas"}
          </p>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            Items en Vista
          </span>
          <span className="text-2xl font-black text-slate-900">
            {requisicionesFiltradas.length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* CONTROLES: TABS + BUSCADOR */}
      <div className="flex gap-2 flex-wrap">
        {(hasAprobar
          ? [
              {
                key: "pendientes",
                label: "Pendientes",
                color: "bg-amber-500",
              },
              {
                key: "aprobadas",
                label: "Aprobadas",
                color: "bg-emerald-500",
              },
              {
                key: "cotizadas",
                label: "Cotizadas",
                color: "bg-blue-500",
              },
              {
                key: "rechazadas",
                label: "Rechazadas",
                color: "bg-red-500",
              },
            ]
          : [
              {
                key: "aprobadas",
                label: "Aprobadas",
                color: "bg-emerald-500",
              },
              {
                key: "cotizadas",
                label: "Cotizadas",
                color: "bg-blue-500",
              },
            ]
        ).map((t: any) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${
              tab === t.key
                ? `${t.color} text-white shadow-lg border-transparent`
                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLA DE APROBACIONES */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="font-black text-[10px] uppercase pl-10 py-5 tracking-widest text-slate-400">
                  Folio
                </th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">
                  Obra Destino
                </th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">
                  Solicitante
                </th>
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">
                  Envío
                </th>
                {tab === "cotizadas" && (
                  <>
                    <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">
                      Factura
                    </th>
                    <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400">
                      Forma de Pago
                    </th>
                  </>
                )}
                <th className="font-black text-[10px] uppercase py-5 tracking-widest text-slate-400 text-right pr-10">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requisicionesFiltradas.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  <td className="pl-10 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-red-600 p-2 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                        <FileText size={16} />
                      </div>
                      <span className="text-slate-900 font-black text-sm uppercase">
                        {r.folio}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 font-bold text-xs text-slate-600 uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-300" />{" "}
                      {r.obra}
                    </div>
                  </td>
                  <td className="py-5 font-bold text-xs text-slate-500 uppercase">
                    {r.solicitado_por}
                  </td>
                  <td className="py-5">
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                      {formatFecha(r.fecha_envio)}
                    </span>
                  </td>
                  {tab === "cotizadas" && (
                    <>
                      <td className="py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                            r.requiere_factura
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Receipt size={12} />{" "}
                          {r.requiere_factura ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="py-5">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                          <CreditCard size={12} />{" "}
                          {r.forma_pago === "contado" ? "Contado" : "Crédito"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="py-5 pr-10 text-right">
                    <div className="flex justify-end gap-2">
                      {tab === "aprobadas" && hasAprobar && (
                        <Button
                          onClick={() => abrirCotizar(r)}
                          variant="outline"
                          className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-black uppercase text-[9px] tracking-widest h-10 px-4 rounded-xl transition-all"
                        >
                          <span className="flex items-center gap-1.5">
                            <UploadCloud size={14} /> Cotizar
                          </span>
                        </Button>
                      )}
                      {tab === "cotizadas" && (
                        <>
                          {r.cotizacion_url && (
                            <a
                              href={getCotizacionUrl(r.cotizacion_url) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white h-10 px-4 rounded-xl transition-all"
                            >
                              <FileCheck2 size={14} />
                              Ver
                            </a>
                          )}
                          {hasAprobar && (
                            <Button
                              onClick={() => abrirCotizar(r)}
                              variant="outline"
                              className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-black uppercase text-[9px] tracking-widest h-10 px-4 rounded-xl transition-all"
                            >
                              <span className="flex items-center gap-1.5">
                                <Pencil size={14} /> Editar
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        onClick={() => abrirModal(r.id)}
                        className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-10 px-6 rounded-xl transition-all"
                      >
                        REVISAR
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requisicionesFiltradas.length === 0 && !loading && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-300">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">
              No se encontraron resultados
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE COTIZACIÓN (crear o editar) */}
      <Dialog open={cotizarOpen} onOpenChange={(v) => !v && cerrarCotizar()}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <UploadCloud size={22} className="text-blue-400" />
              {cotizarTarget?.cotizacion_url
                ? "Editar Cotización"
                : "Cotizar Requisición"}
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic">
              {cotizarTarget?.folio}
            </p>
          </div>

          <div className="p-8 space-y-6 bg-white">
            {/* Archivo */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Archivo de Cotización{" "}
                {cotizarTarget?.cotizacion_url
                  ? "(opcional, reemplaza el actual)"
                  : ""}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={onSeleccionarArchivoCotizacion}
                className="w-full text-xs font-bold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-widest file:bg-slate-900 file:text-white hover:file:bg-red-600 file:transition-all border border-slate-100 bg-slate-50 rounded-2xl p-2"
              />
              {cotizarTarget?.cotizacion_url && !archivoCotizacion && (
                <p className="text-[10px] font-bold text-slate-400">
                  Ya existe una cotización cargada. Si no seleccionas un archivo
                  nuevo, se conserva la actual.
                </p>
              )}
            </div>

            {/* Requiere factura */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                ¿Requiere Factura?
              </label>
              <div className="flex gap-2">
                {[
                  { value: "true", label: "Sí" },
                  { value: "false", label: "No" },
                ].map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() =>
                      setRequiereFactura(op.value as "true" | "false")
                    }
                    className={`flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                      requiereFactura === op.value
                        ? "bg-slate-900 text-white border-transparent"
                        : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Forma de pago */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Forma de Pago
              </label>
              <div className="flex gap-2">
                {[
                  { value: "contado", label: "Contado" },
                  { value: "credito", label: "Crédito" },
                ].map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() =>
                      setFormaPago(op.value as "contado" | "credito")
                    }
                    className={`flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                      formaPago === op.value
                        ? "bg-slate-900 text-white border-transparent"
                        : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condiciones / cuotas */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Condiciones de Pago / Cuotas{" "}
                {formaPago === "credito" ? "" : "(opcional)"}
              </label>
              <textarea
                placeholder="EJ. 3 PAGOS MENSUALES, 50% ANTICIPO, ETC."
                className="w-full h-20 border border-slate-100 bg-slate-50 rounded-2xl p-4 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500/10 outline-none resize-none"
                value={condicionesPago}
                onChange={(e) => setCondicionesPago(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              onClick={cerrarCotizar}
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarCotizacion}
              disabled={guardandoCotizacion}
              className="flex-[2] h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-blue-600 text-white transition-all shadow-xl shadow-slate-900/20"
            >
              {guardandoCotizacion ? (
                <Loader2 size={16} className="animate-spin" />
              ) : cotizarTarget?.cotizacion_url ? (
                "Guardar Cambios"
              ) : (
                "Guardar Cotización"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REVISIÓN - mismo estilo que el modal de Proveedores */}
      <Dialog open={open} onOpenChange={(v) => !v && cerrarModal()}>
        <DialogContent className="max-w-6xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          {requisicion && (
            <>
              <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <FileText size={24} className="text-red-600" />
                  {requisicion.folio}
                </DialogTitle>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic">
                  Revisión de requisición de materiales
                </p>
              </div>

              <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InfoItem
                    label="Obra Destino"
                    value={requisicion.obra}
                    icon={<Building2 size={12} />}
                  />
                  <InfoItem
                    label="Partida"
                    value={requisicion.partida}
                    icon={<Layers size={12} />}
                  />
                  <InfoItem
                    label="Solicitante"
                    value={requisicion.solicitado_por}
                    icon={<User size={12} />}
                  />
                  <InfoItem
                    label="Fecha Envío"
                    value={formatFecha(requisicion.fecha_envio)}
                    icon={<Calendar size={12} />}
                  />
                </div>

                {/* Insumos Table */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Materiales Requeridos
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        {detalles.map((d) => (
                          <tr key={d.id} className="text-xs">
                            <td className="p-4 pl-6 font-black uppercase text-slate-700">
                              {d.descripcion}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-400">
                              {d.unidad}
                            </td>
                            <td className="p-4 text-center font-black text-slate-900">
                              {d.cantidad}
                            </td>
                            <td className="p-4 text-right pr-6 font-bold text-slate-400 italic">
                              {formatFecha(d.fecha_requerida)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cotización: autorizada -> invita a cotizar / cotizada -> resumen de solo lectura */}
                {requisicion.estado === "autorizada" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                      <UploadCloud size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Cotización
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 text-slate-400 p-2 rounded-xl">
                          <Clock size={16} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Aún no se ha cotizado esta requisición
                        </p>
                      </div>
                      {hasAprobar && (
                        <Button
                          onClick={() => abrirCotizar(requisicion)}
                          className="bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-[9px] tracking-widest h-auto py-2.5 px-4 rounded-xl transition-all"
                        >
                          <span className="flex items-center gap-1.5">
                            <UploadCloud size={14} /> Cotizar
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {requisicion.estado === "cotizada" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                      <FileCheck2 size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Cotización
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                            <FileCheck2 size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-900">
                              Cotización cargada
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {formatFecha(requisicion.cotizacion_subida_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {requisicion.cotizacion_url && (
                            <a
                              href={
                                getCotizacionUrl(requisicion.cotizacion_url) ||
                                "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all"
                            >
                              Ver Archivo
                            </a>
                          )}
                          {hasAprobar && (
                            <Button
                              variant="outline"
                              onClick={() => abrirCotizar(requisicion)}
                              className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-black uppercase text-[9px] tracking-widest h-auto py-2.5 px-4 rounded-xl transition-all"
                            >
                              <span className="flex items-center gap-1.5">
                                <Pencil size={14} /> Editar
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-slate-300" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              Requiere Factura
                            </p>
                            <p className="text-xs font-black uppercase text-slate-900">
                              {requisicion.requiere_factura ? "Sí" : "No"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-slate-300" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              Forma de Pago
                            </p>
                            <p className="text-xs font-black uppercase text-slate-900">
                              {requisicion.forma_pago === "contado"
                                ? "Contado"
                                : "Crédito"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {requisicion.condiciones_pago && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            Condiciones de Pago
                          </p>
                          <p className="text-xs font-bold uppercase text-slate-600">
                            {requisicion.condiciones_pago}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Motivo de rechazo: campo editable solo si puede aprobar y está pendiente de resolución */}
                {puedeVerAccionesModal && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
                      <AlertCircle size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Motivo de Rechazo
                      </span>
                    </div>
                    <textarea
                      placeholder="ESCRIBA EL MOTIVO AQUÍ..."
                      className="w-full h-24 border border-slate-100 bg-slate-50 rounded-3xl p-6 text-xs font-bold uppercase focus:ring-2 focus:ring-red-600/10 outline-none resize-none"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>
                )}

                {/* Motivo de rechazo ya registrado: visible en modo solo lectura para requisiciones rechazadas */}
                {!puedeVerAccionesModal &&
                  requisicion.estado === "rechazada" &&
                  requisicion.motivo_rechazo && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
                        <AlertCircle size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Motivo de Rechazo
                        </span>
                      </div>
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-xs font-bold uppercase text-slate-600">
                        {requisicion.motivo_rechazo}
                      </div>
                    </div>
                  )}

                {/* Historial Estilizado */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                    <History size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Historial de Movimientos
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                    <div className="space-y-4">
                      {historial.map((h: any) => (
                        <div
                          key={h.id}
                          className="flex gap-4 items-start relative pb-4 last:pb-0 border-b border-slate-100 last:border-0"
                        >
                          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm font-black text-[8px] text-slate-400 w-24 text-center">
                            {new Date(h.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black uppercase text-slate-900">
                                {h.usuario}
                              </span>
                              <span className="text-[8px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-md leading-none">
                                {h.accion}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 italic">
                              "{h.comentario || "Sin observaciones"}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button
                  variant="outline"
                  onClick={cerrarModal}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  Cerrar Detalle
                </Button>
                {puedeVerAccionesModal && (
                  <>
                    <Button
                      onClick={rechazar}
                      className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                    >
                      Rechazar
                    </Button>
                    <Button
                      onClick={autorizar}
                      className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-red-600 text-white transition-all shadow-xl shadow-slate-900/20"
                    >
                      Autorizar Suministro
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        <span className="text-red-600">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-xs font-black text-slate-900 uppercase truncate">
        {value}
      </p>
    </div>
  );
}

function Layers({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
