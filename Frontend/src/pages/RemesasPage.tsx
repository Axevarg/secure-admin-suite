import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle,
  DollarSign,
  PackageCheck,
  Eye,
  Plus,
  Search,
  TrendingUp,
  Layers,
  X,
} from "lucide-react";

interface Remesa {
  id: number;
  folio: number;
  proveedor: string;
  obra: string;
  monto_total: number;
  estado: string;
}

interface Requisicion {
  id: number;
  folio: number;
  obra: string;
}

interface DetalleReq {
  id: number;
  insumo: string;
  cantidad: number;
  precio_estimado: number | null;
}

interface Proveedor {
  id: number;
  nombre: string;
}

// Asignación por insumo: proveedor + precio
interface AsignacionDetalle {
  proveedor_id: number | null;
  precio: number | null;
}

export default function RemesasPage() {
  const [remesas, setRemesas] = useState<Remesa[]>([]);
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [detalles, setDetalles] = useState<DetalleReq[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [selected, setSelected] = useState<any>(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);

  const [openPagar, setOpenPagar] = useState(false);
  const [remesaPago, setRemesaPago] = useState<Remesa | null>(null);

  const [cuentas, setCuentas] = useState<any[]>([]);

  const [pagoForm, setPagoForm] = useState({
    cuenta_id: "",
    concepto: "",
  });

  const cuentaSeleccionada = cuentas.find(
    (c) => c.id === Number(pagoForm.cuenta_id),
  );

  const [reqId, setReqId] = useState<number | null>(null); // ✅ Ahora guarda { proveedor_id, precio } por detalle_id
  const [asignaciones, setAsignaciones] = useState<
    Record<number, AsignacionDetalle>
  >({});

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todas");

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role_name === "admin";

  const loadRemesas = async () => {
    const res = await api.get("/remesas");
    setRemesas(res.data);
  };

  const loadRequisiciones = async () => {
    const res = await api.get("/remesas/requisiciones/aprobadas-sin-remesa");
    setRequisiciones(res.data);
  };

  const loadProveedores = async () => {
    const res = await api.get("/proveedores");
    setProveedores(res.data);
  };

  const loadCuentas = async () => {
    const res = await api.get("/bancos/cuentas");
    setCuentas(res.data.filter((c: any) => c.activa));
  };

  useEffect(() => {
    loadRemesas();
  }, []);

  const seleccionarRequisicion = async (id: number) => {
    setReqId(id);
    setAsignaciones({});
    const res = await api.get(`/remesas/requisiciones/${id}/detalles`);
    setDetalles(res.data);
  }; // Actualizar proveedor o precio de un insumo

  const setAsignacion = (
    detalleId: number,
    campo: keyof AsignacionDetalle,
    valor: number,
  ) => {
    setAsignaciones((prev) => ({
      ...prev,
      [detalleId]: {
        ...prev[detalleId],
        [campo]: valor,
      },
    }));
  };

  const generarRemesas = async () => {
    if (!reqId) return alert("Selecciona una requisición");

    // ✅ Leer desde sessionStorage
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const uid = user.id;
    if (!uid) return alert("No se encontró el usuario en sesión");

    const incompletos = detalles.filter(
      (d) => !asignaciones[d.id]?.proveedor_id || !asignaciones[d.id]?.precio,
    );
    if (incompletos.length > 0)
      return alert(
        `Faltan proveedor o precio en: ${incompletos.map((d) => d.insumo).join(", ")}`,
      );

    const detallesPayload = detalles.map((d) => ({
      detalle_id: d.id,
      proveedor_id: asignaciones[d.id].proveedor_id,
      precio: asignaciones[d.id].precio,
    }));

    await api.post(`/remesas/generar/${reqId}`, {
      usuario_id: uid, // ✅ UUID correcto desde sessionStorage
      detalles: detallesPayload,
    });

    setOpenCrear(false);
    setDetalles([]);
    setAsignaciones({});
    setReqId(null);
    loadRemesas();
  };

const autorizar = async (id: number) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  await api.put(`/remesas/autorizar/${id}`, {
    usuario_id: user.id, // UUID
  });

  loadRemesas();
};

  const pagar = async (id: number) => {
    await api.put(`/remesas/pagada/${id}`);
    loadRemesas();
  };

const confirmarPago = async () => {
  if (!remesaPago) return;

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  if (!pagoForm.cuenta_id) {
    return alert("Selecciona una cuenta bancaria");
  }

  if (
    cuentaSeleccionada &&
    Number(cuentaSeleccionada.balance) < remesaPago.monto_total
  ) {
    return alert("Fondos insuficientes");
  }

  await api.put(`/remesas/${remesaPago.id}/pagar-con-banco`, {
    cuenta_id: pagoForm.cuenta_id,
    concepto: pagoForm.concepto,
    fecha_movimiento: new Date(),
    usuario_id: user.id, // UUID
  });

  setOpenPagar(false);
  setRemesaPago(null);

  loadRemesas();
};

  const recibir = async (id: number) => {
    await api.put(`/remesas/recibida/${id}`);
    loadRemesas();
  };
  const excedePrecio = (detalleId: number) => {
    const precioCapturado = asignaciones[detalleId]?.precio;
    const detalle = detalles.find((d) => d.id === detalleId);

    if (!precioCapturado || !detalle?.precio_estimado) return false;

    return precioCapturado > detalle.precio_estimado;
  };

  const verDetalle = async (id: number) => {
    const res = await api.get(`/remesas/${id}`);
    setSelected(res.data);
    setOpenDetalle(true);
  };

  const filtered = remesas
    .filter(
      (r) =>
        (estadoFiltro === "todas" || r.estado === estadoFiltro) &&
        r.obra?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const orden: Record<string, number> = {
        pendiente: 0,
        autorizada: 1,
        pagada: 2,
        recibida: 3,
      };
      return (orden[a.estado] ?? 99) - (orden[b.estado] ?? 99);
    });

  const estadoBadge: Record<string, { bg: string; text: string; dot: string }> =
    {
      pendiente: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      },
      autorizada: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      },
      pagada: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      },
      recibida: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        dot: "bg-slate-400",
      },
    };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SIGO HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
        <div className="flex gap-5 items-center relative z-10">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
            <FileText size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Remesas & Pagos
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Gestión operativa de órdenes de compra
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setOpenCrear(true);
            loadRequisiciones();
            loadProveedores();
          }}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all border-none outline-none"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={3} />
          Generar Nuevas Remesas
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <Input
            placeholder="FILTRAR POR NOMBRE DE OBRA O PROYECTO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-none bg-slate-50 font-bold text-xs uppercase tracking-widest focus-visible:ring-red-600/10"
          />
        </div>
        <select
          className="h-12 bg-slate-50 border-none rounded-xl px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-red-600/10 outline-none w-full md:w-48 cursor-pointer"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="todas">Todos los estados</option>
          <option value="pendiente">🟠 Pendientes</option>
          <option value="autorizada">🔵 Autorizadas</option>
          <option value="pagada">🟢 Pagadas</option>
          <option value="recibida">⚪ Recibidas</option>
        </select>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Folio SIGO
              </th>
              <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Proveedor Asignado
              </th>
              <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Obra / Destino
              </th>
              <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Monto Total
              </th>
              <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Estado
              </th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="group hover:bg-slate-50/50 transition-all"
              >
                <td className="p-6">
                  <span className="font-black text-slate-900 text-sm tracking-tighter">
                    REM-{r.folio}
                  </span>
                </td>
                <td className="p-6 font-bold text-xs text-slate-600 uppercase italic">
                  {r.proveedor ?? "SIN ASIGNAR"}
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight text-slate-700">
                      {r.obra}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">
                      Constructora Iliasa
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <span className="font-black text-sm text-slate-900">
                    $
                    {r.monto_total?.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="p-6">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${estadoBadge[r.estado]?.bg} ${estadoBadge[r.estado]?.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${estadoBadge[r.estado]?.dot}`}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {r.estado}
                    </span>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => verDetalle(r.id)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                    >
                      <Eye size={16} />
                    </button>

                    {r.estado === "pendiente" && isAdmin && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-10"
                        onClick={() => autorizar(r.id)}
                      >
                        Autorizar
                      </Button>
                    )}
                    {r.estado === "autorizada" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-10"
                        onClick={() => {
                          setRemesaPago(r);
                          setOpenPagar(true);
                          loadCuentas();

                          setPagoForm({
                            cuenta_id: "",
                            concepto: `Pago remesa HGZ.${r.folio}`,
                          });
                        }}
                      >
                        Pagar
                      </Button>
                    )}
                    {r.estado === "pagada" && (
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-10"
                        onClick={() => recibir(r.id)}
                      >
                        Recibida
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL CREAR REMESAS REDISEÑADO ===== */}
      {openCrear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[1rem] w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="bg-slate-900 p-10 text-white relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp size={24} className="text-red-600" />
                    Consolidación de Remesas
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2 ml-1">
                    Transformación de Requisición a Órdenes de Compra
                  </p>
                </div>
                <button
                  onClick={() => setOpenCrear(false)}
                  className="bg-white/10 hover:bg-red-600 p-3 rounded-2xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <Layers size={12} /> Seleccionar Requisición Autorizada
                </label>
                <select
                  className="w-full h-14 rounded-2xl border-slate-100 bg-white font-black text-xs uppercase focus:ring-red-600/10 shadow-sm px-6"
                  onChange={(e) =>
                    seleccionarRequisicion(Number(e.target.value))
                  }
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccione un folio de requisición...
                  </option>
                  {requisiciones.map((r) => (
                    <option key={r.id} value={r.id}>
                      FOLIO {r.folio} — PROYECTO: {r.obra}
                    </option>
                  ))}
                </select>
              </div>

              {detalles.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                      Asignación de Costos por Insumo
                    </h3>
                    <div className="h-px flex-1 bg-slate-200 mx-4" />
                  </div>

                  <div className="grid gap-4">
                    {detalles.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-red-600 uppercase mb-1">
                              Insumo Requerido
                            </p>
                            <p className="font-black text-slate-800 uppercase text-sm truncate">
                              {d.insumo}
                            </p>
                            <span className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">
                              CANTIDAD: {d.cantidad}
                            </span>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="w-full md:w-64">
                              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-2">
                                Proveedor
                              </label>
                              <select
                                className="w-full h-12 border-slate-100 bg-slate-50 rounded-xl px-4 text-xs font-bold uppercase"
                                onChange={(e) =>
                                  setAsignacion(
                                    d.id,
                                    "proveedor_id",
                                    Number(e.target.value),
                                  )
                                }
                              >
                                <option value="">Seleccionar...</option>
                                {proveedores.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-full md:w-40">
                              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-2">
                                P. Unitario
                              </label>
                              <div className="relative">
                                <DollarSign
                                  size={12}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className={`h-12 pl-8 rounded-xl border font-black text-xs ${
                                    excedePrecio(d.id)
                                      ? "border-red-400 bg-red-50"
                                      : "border-slate-100 bg-slate-50"
                                  }`}
                                  onChange={(e) =>
                                    setAsignacion(
                                      d.id,
                                      "precio",
                                      parseFloat(e.target.value),
                                    )
                                  }
                                />
                                {d.precio_estimado && (
                                  <div className="mt-2 text-[10px] font-bold uppercase">
                                    <span className="text-slate-400">
                                      Precio estimado: $
                                      {d.precio_estimado.toLocaleString(
                                        "es-MX",
                                      )}
                                    </span>

                                    {excedePrecio(d.id) && (
                                      <div className="text-red-600 font-black mt-1">
                                        ⚠ Precio mayor al estimado de obra
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-white border-t border-slate-100 flex gap-4 justify-end items-center shrink-0">
              <button
                onClick={() => setOpenCrear(false)}
                className="font-black text-[10px] uppercase text-slate-400 tracking-widest px-6"
              >
                Descartar
              </button>
              <Button
                onClick={generarRemesas}
                disabled={detalles.length === 0}
                className="bg-slate-900 hover:bg-red-600 text-white font-black px-12 h-16 rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl transition-all border-none"
              >
                Generar Remesas SIGO
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETALLE — FORMATO DOCUMENTO OFICIAL PREMIUM CORREGIDO ===== */}
      <Dialog open={openDetalle} onOpenChange={setOpenDetalle}>
        <DialogContent className="max-w-5xl bg-slate-50 p-0 overflow-hidden rounded-[2rem] shadow-2xl border-none">
          <div className="max-h-[80vh] overflow-y-auto p-8 scrollbar-hide">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 rounded-sm p-12 min-h-[1050px] relative overflow-hidden font-['Geist',sans-serif]">
              {/* ── ENCABEZADO ── */}
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 relative z-10">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-black text-2xl tracking-tighter">
                      CI
                    </span>
                  </div>
                  <div>
                    <h1 className="font-black text-slate-900 text-xl uppercase tracking-tighter">
                      MARIA ARACELI VARGAS ZARCO
                    </h1>
                    <p className="text-red-600 font-bold text-xs tracking-[0.2em] mb-1">
                      VAZA650302N78
                    </p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold max-w-xs leading-tight">
                      Construcción, Obra Civil y Comercializadora
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-slate-900 text-white px-6 py-3 rounded-xl inline-block shadow-lg shadow-slate-200">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 text-center">
                      Remesa N°
                    </p>
                    <p className="text-xl font-black tracking-tighter uppercase">
                      HGZ.{selected?.remesa?.folio}{" "}
                      {selected?.remesa?.obra?.split(" ").slice(-1)[0]}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── METADATA COMPLETA (4 COLUMNAS PARA INTEGRAR TODO) ── */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 py-8 relative z-10 text-[10px] border-b border-slate-100 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="font-black text-slate-400 uppercase tracking-widest">
                      01- Proyecto:
                    </span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selected?.remesa?.obra}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="font-black text-slate-400 uppercase tracking-widest">
                      Fecha Elaboración:
                    </span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selected?.remesa?.fecha_elaboracion
                        ? new Date(selected.remesa.fecha_elaboracion)
                            .toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                            .toUpperCase()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="font-black text-slate-400 uppercase tracking-widest">
                      Puesto en Obra:
                    </span>
                    <span className="font-bold text-slate-900 uppercase italic">
                      {selected?.remesa?.fecha
                        ? new Date(selected.remesa.fecha)
                            .toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                            .toUpperCase()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="font-black text-slate-400 uppercase tracking-widest">
                      Solicitó:
                    </span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selected?.remesa?.solicito ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="font-black text-slate-400 uppercase tracking-widest">
                      Centro de Costo:
                    </span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selected?.remesa?.concepto ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1 text-red-600">
                    <span className="font-black uppercase tracking-widest">
                      Estatus Actual:
                    </span>
                    <span className="font-black uppercase">
                      {selected?.remesa?.estado ?? "PENDIENTE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CAMPO CONCEPTO / DESCRIPCIÓN GENERAL */}
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border-l-4 border-slate-900">
                <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">
                  Concepto General del Pago:
                </p>
                <p className="text-[11px] font-bold text-slate-800 uppercase">
                  {selected?.remesa?.descripcion ?? "SIN DESCRIPCIÓN ADICIONAL"}
                </p>
              </div>

              {/* ── TABLA DE DATOS ── */}
              <div className="border border-slate-900 rounded-sm overflow-hidden mb-8 shadow-sm">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 font-black uppercase text-center border-r border-white/20">
                        Proveedor
                      </th>
                      <th className="p-3 font-black uppercase text-center border-r border-white/20 w-[30%]">
                        Descripción
                      </th>
                      <th className="p-3 font-black uppercase text-center border-r border-white/20">
                        Banco / CLABE
                      </th>
                      <th className="p-3 font-black uppercase text-center border-r border-white/20">
                        Folio/Req
                      </th>
                      <th className="p-3 font-black uppercase text-center">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected?.detalles?.map((d: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 align-top hover:bg-slate-50/50"
                      >
                        <td className="p-4 text-center font-black uppercase border-r border-slate-900 align-middle">
                          {d.proveedor}
                        </td>
                        <td className="p-4 uppercase border-r border-slate-900 leading-relaxed font-medium">
                          {d.cantidad} {d.insumo}
                        </td>
                        <td className="p-4 text-center align-middle border-r border-slate-900">
                          <p className="font-bold text-slate-900 italic uppercase">
                            {d.banco ?? "—"}
                          </p>
                          <p className="text-[9px] tracking-widest font-mono text-slate-500">
                            {d.clabe ?? "—"}
                          </p>
                        </td>
                        <td className="p-4 text-center align-middle border-r border-slate-900 font-bold uppercase">
                          {selected.remesa?.folio}
                        </td>
                        <td className="p-4 text-right align-middle font-black bg-slate-50/30">
                          $
                          {Number(d.subtotal).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                    {/* Espacios vacíos reglamentarios */}
                    {[...Array(3)].map((_, i) => (
                      <tr
                        key={`empty-${i}`}
                        className="border-b border-slate-50"
                      >
                        <td className="h-10 border-r border-slate-900" />
                        <td className="h-10 border-r border-slate-900" />
                        <td className="h-10 border-r border-slate-900" />
                        <td className="h-10 border-r border-slate-900" />
                        <td className="h-10" />
                      </tr>
                    ))}
                    {/* FILA TOTAL */}
                    <tr className="bg-slate-900 text-white">
                      <td
                        colSpan={4}
                        className="p-3 text-right font-black uppercase tracking-[0.2em] text-[9px]"
                      >
                        Total Autorizado para Pago:
                      </td>
                      <td className="p-3 text-right font-black text-sm">
                        $
                        {selected?.detalles
                          ?.reduce(
                            (s: number, d: any) => s + Number(d.subtotal),
                            0,
                          )
                          .toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── FIRMAS ── */}
              <div className="mt-16 grid grid-cols-2 gap-24 px-12">
                <div className="text-center group">
                  <div className="mb-4 h-16 flex items-end justify-center relative"></div>
                  <div className="border-t-2 border-slate-900 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                      ELABORÓ Y REVISÓ
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                      {selected?.remesa?.elaboro ?? "LCP. PAMELA DELGADO"}
                    </p>
                  </div>
                </div>

                <div className="text-center group">
                  <div className="mb-4 h-16 flex items-end justify-center relative"></div>
                  <div className="border-t-2 border-slate-900 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                      VISTO BUENO DIRECCIÓN
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                      {selected?.remesa?.autorizo ??
                        "LIC. CECILIO ALVARADO VARGAS"}
                    </p>
                    <p className="text-[8px] text-slate-400 uppercase tracking-tighter">
                      Director General
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center px-12">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
              SIGO | Documento Interno de Control
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 px-8"
              >
                🖨️ Imprimir
              </Button>
              <Button
                onClick={() => setOpenDetalle(false)}
                className="bg-slate-900 hover:bg-red-600 text-white font-black px-10 rounded-xl uppercase tracking-widest text-[10px] transition-all"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {openPagar && remesaPago && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl">
            {/* HEADER */}
            <div className="bg-slate-900 p-8 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Pagar Remesa
              </h2>

              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mt-2">
                Selecciona la cuenta bancaria
              </p>
            </div>

            {/* BODY */}
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Remesa
                </p>

                <h3 className="text-lg font-black">HGZ.{remesaPago.folio}</h3>

                <p className="text-sm text-slate-500">{remesaPago.proveedor}</p>

                <p className="mt-3 text-2xl font-black text-emerald-600">
                  $
                  {remesaPago.monto_total?.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* CUENTA */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Cuenta bancaria
                </label>

                <select
                  value={pagoForm.cuenta_id}
                  onChange={(e) =>
                    setPagoForm({
                      ...pagoForm,
                      cuenta_id: e.target.value,
                    })
                  }
                  className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 px-5 font-black text-xs uppercase"
                >
                  <option value="">Seleccionar cuenta...</option>

                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {c.banco} — $
                      {Number(c.balance).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </option>
                  ))}
                </select>

                {cuentaSeleccionada && (
                  <div
                    className={`rounded-2xl p-5 border ${
                      Number(cuentaSeleccionada.balance) >=
                      remesaPago.monto_total
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Saldo Disponible
                        </p>

                        <h3
                          className={`text-2xl font-black mt-1 ${
                            Number(cuentaSeleccionada.balance) >=
                            remesaPago.monto_total
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          $
                          {Number(cuentaSeleccionada.balance).toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Después del pago
                        </p>

                        <h3 className="text-lg font-black text-slate-700 mt-1">
                          $
                          {(
                            Number(cuentaSeleccionada.balance) -
                            remesaPago.monto_total
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </h3>
                      </div>
                    </div>

                    {Number(cuentaSeleccionada.balance) <
                      remesaPago.monto_total && (
                      <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-600">
                        ⚠ Fondos insuficientes en esta cuenta
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONCEPTO */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Concepto
                </label>

                <Input
                  value={pagoForm.concepto}
                  onChange={(e) =>
                    setPagoForm({
                      ...pagoForm,
                      concepto: e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-8 border-t border-slate-100 flex gap-4 justify-end">
              <button
                onClick={() => setOpenPagar(false)}
                className="h-12 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarPago}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}
