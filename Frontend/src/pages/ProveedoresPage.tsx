import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  Users,
  Search,
  Info,
  Mail,
  Phone,
  Fingerprint,
  MapPin,
  Building,
  CreditCard,
  UserCheck,
  X, RefreshCcw, Wallet, Clock, CheckCircle2, TrendingUp
} from "lucide-react";

interface Proveedor {
  id?: number;
  nombre: string;
  rfc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  banco?: string;
  clabe?: string;
  titular_cuenta?: string;
  activo?: boolean;
}

const emptyProveedor: Proveedor = {
  nombre: "",
  rfc: "",
  telefono: "",
  email: "",
  direccion: "",
  banco: "",
  clabe: "",
  titular_cuenta: "",
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [formProveedor, setFormProveedor] = useState<Proveedor>(emptyProveedor);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/proveedores");
      setProveedores(res.data);
    } catch (err) {
      console.error("Error al cargar proveedores", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = (p?: Proveedor) => {
    if (p) {
      setFormProveedor(p);
    } else {
      setFormProveedor(emptyProveedor);
    }
    setOpenModal(true);
  };


  const [cuentaModal, setCuentaModal] = useState<{
  proveedor: Proveedor;
  resumen: any;
  historial_pagos: any[];
  historial_remesas: any[];
} | null>(null);
const [loadingCuenta, setLoadingCuenta] = useState(false);

const verCuenta = async (p: Proveedor) => {
  setLoadingCuenta(true);
  try {
    const res = await api.get(`/proveedores/${p.id}/resumen`);
    setCuentaModal({
      proveedor: p,
      resumen: res.data.resumen,
      historial_pagos: res.data.historial_pagos,
      historial_remesas: res.data.historial_remesas,
    });
  } finally {
    setLoadingCuenta(false);
  }
};

const fmt = (n: number) =>
  (n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

  const guardarProveedor = async () => {
    if (!formProveedor.nombre) return alert("Nombre requerido");
    
    try {
      if (formProveedor.id) {
        await api.put(`/proveedores/${formProveedor.id}`, formProveedor);
      } else {
        await api.post("/proveedores", formProveedor);
      }
      setOpenModal(false);
      load();
    } catch (error) {
      alert("Error al guardar los cambios");
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Desactivar proveedor?")) return;
    await api.delete(`/proveedores/${id}`);
    load();
  };

  const filteredProveedores = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Sincronizando Directorio...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
            <Users size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Proveedores</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              {proveedores.length} Proveedores Registrados
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:min-w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="BUSCAR PROVEEDOR O RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs uppercase tracking-widest focus-visible:ring-red-600/10"
            />
          </div>
          <Button 
            onClick={() => handleOpenModal()}
            className="bg-red-600 hover:bg-slate-900 text-white font-black h-12 px-6 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 transition-all"
          >
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-left font-black text-[10px] uppercase tracking-widest text-slate-400">
              <th className="px-10 py-5">Razón Social / RFC</th>
              <th className="px-6 py-5">Información de Contacto</th>
              <th className="px-6 py-5">Ubicación</th>
              <th className="px-10 py-5 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProveedores.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <p className="font-black text-slate-900 text-sm uppercase">{p.nombre}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.rfc || 'SIN RFC'}</span>
                </td>
                <td className="px-6 py-5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Phone size={12} className="text-red-500" /> {p.telefono || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 lowercase">
                    <Mail size={12} className="text-slate-300" /> {p.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-start gap-2 max-w-xs">
                    <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed line-clamp-2">
                      {p.direccion || 'DIRECCIÓN NO REGISTRADA'}
                    </p>
                  </div>
                </td>
                <td className="px-10 py-5 text-right">
  <div className="flex justify-end gap-2">
    <Button
      variant="outline"
      onClick={() => verCuenta(p)}
      disabled={loadingCuenta}
      className="h-10 rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
    >
      <Wallet size={14} className="mr-1.5" />
      Ver Cuenta
    </Button>
    <Button
      variant="outline"
      onClick={() => handleOpenModal(p)}
      className="h-10 rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
    >
      Editar
    </Button>
    <Button
      variant="outline"
      onClick={() => eliminar(p.id!)}
      className="h-10 w-10 p-0 rounded-xl border-slate-100 text-slate-300 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 size={16} />
    </Button>
  </div>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              {formProveedor.id ? <RefreshCcw size={24} className="text-red-600" /> : <Plus size={24} className="text-red-600" />}
              {formProveedor.id ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic">Complete los datos del expediente</p>
          </div>

          <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
            {/* Sección: Datos Generales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-red-600 pl-3">
                <Building size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identificación Fiscal</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 lg:col-span-1">
                  <InputLabel label="Nombre o Razón Social" />
                  <Input 
                    value={formProveedor.nombre} 
                    onChange={e => setFormProveedor({...formProveedor, nombre: e.target.value.toUpperCase()})}
                    className="form-sigo"
                  />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <InputLabel label="RFC" />
                  <Input 
                    value={formProveedor.rfc} 
                    onChange={e => setFormProveedor({...formProveedor, rfc: e.target.value.toUpperCase()})}
                    className="form-sigo"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <Phone size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto y Ubicación</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel label="Teléfono" />
                  <Input 
                    value={formProveedor.telefono} 
                    onChange={e => setFormProveedor({...formProveedor, telefono: e.target.value})}
                    className="form-sigo"
                  />
                </div>
                <div>
                  <InputLabel label="Correo Electrónico" />
                  <Input 
                    value={formProveedor.email} 
                    onChange={e => setFormProveedor({...formProveedor, email: e.target.value.toLowerCase()})}
                    className="form-sigo"
                  />
                </div>
                <div className="col-span-2">
                  <InputLabel label="Dirección Completa" />
                  <Input 
                    value={formProveedor.direccion} 
                    onChange={e => setFormProveedor({...formProveedor, direccion: e.target.value.toUpperCase()})}
                    className="form-sigo"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Bancarios */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                <CreditCard size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos de Dispersión (Bancarios)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="col-span-1">
                  <InputLabel label="Banco" />
                  <Input 
                    value={formProveedor.banco} 
                    onChange={e => setFormProveedor({...formProveedor, banco: e.target.value.toUpperCase()})}
                    className="form-sigo bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <InputLabel label="Cuenta CLABE (18 dígitos)" />
                  <Input 
                    value={formProveedor.clabe} 
                    onChange={e => setFormProveedor({...formProveedor, clabe: e.target.value})}
                    className="form-sigo bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <InputLabel label="Titular de la Cuenta" />
                  <Input 
                    value={formProveedor.titular_cuenta} 
                    onChange={e => setFormProveedor({...formProveedor, titular_cuenta: e.target.value.toUpperCase()})}
                    className="form-sigo bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setOpenModal(false)}
              className=" font-black text-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 h-14 rounded-2xl font-black uppercase transition-all tracking-widest text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 outline-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={guardarProveedor}
              className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-red-600 text-white transition-all shadow-xl shadow-slate-900/20"
            >
              <Save size={18} className="mr-2" />
              {formProveedor.id ? "Actualizar Proveedor" : "Registrar Proveedor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={!!cuentaModal} onOpenChange={(open) => !open && setCuentaModal(null)}>
  <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
    {cuentaModal && (
      <>
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Wallet size={24} className="text-emerald-500" />
            {cuentaModal.proveedor.nombre}
          </DialogTitle>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">
            Estado de cuenta y trazabilidad de pagos
          </p>
        </div>

        <div className="max-h-[75vh] overflow-y-auto bg-slate-50/30 p-8 space-y-8">
          {/* TARJETAS RESUMEN */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Total Comprado
              </p>
              <p className="text-xl font-black text-slate-900">
                ${fmt(cuentaModal.resumen.total_comprado)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                {cuentaModal.resumen.num_remesas} orden(es)
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-600" /> Total Pagado
              </p>
              <p className="text-xl font-black text-emerald-600">
                ${fmt(cuentaModal.resumen.total_pagado)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                {cuentaModal.resumen.num_pagos} pago(s) confirmado(s)
              </p>
            </div>

            {/* ← Deuda Pendiente: ahora es la suma de órdenes sin procesar + créditos con saldo por abonar */}
            <div
              className={`rounded-2xl p-5 shadow-sm border ${
                cuentaModal.resumen.deuda_pendiente > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-slate-100"
              }`}
            >
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                <Clock size={11} className="text-amber-600" /> Deuda Pendiente
              </p>
              <p
                className={`text-xl font-black ${
                  cuentaModal.resumen.deuda_pendiente > 0 ? "text-amber-600" : "text-slate-400"
                }`}
              >
                ${fmt(cuentaModal.resumen.deuda_pendiente)}
              </p>
              <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 space-y-0.5">
                {cuentaModal.resumen.num_remesas_pendientes > 0 && (
                  <p>{cuentaModal.resumen.num_remesas_pendientes} orden(es) sin pagar</p>
                )}
                {cuentaModal.resumen.num_creditos_pendientes > 0 && (
                  <p className="flex items-center gap-1 text-amber-600">
                    <CreditCard size={9} /> {cuentaModal.resumen.num_creditos_pendientes} crédito(s) con saldo
                  </p>
                )}
                {cuentaModal.resumen.num_remesas_pendientes === 0 &&
                  cuentaModal.resumen.num_creditos_pendientes === 0 && <p>Sin pendientes</p>}
              </div>
            </div>

            <div
              className={`rounded-2xl p-5 shadow-sm border ${
                cuentaModal.resumen.saldo_a_favor > 0
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-slate-100"
              }`}
            >
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                <TrendingUp size={11} className="text-blue-600" /> Saldo a Favor
              </p>
              <p
                className={`text-xl font-black ${
                  cuentaModal.resumen.saldo_a_favor > 0 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                ${fmt(cuentaModal.resumen.saldo_a_favor)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                {cuentaModal.resumen.saldo_a_favor > 0 ? "Revisar pagos duplicados" : "Sin excedentes"}
              </p>
            </div>
          </div>

          {cuentaModal.resumen.total_en_proceso > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-orange-700">
                Hay ${fmt(cuentaModal.resumen.total_en_proceso)} en {cuentaModal.resumen.num_en_proceso} pago(s) aún sin confirmar
              </p>
            </div>
          )}

          {/* ← NUEVO: aviso específico de créditos con saldo pendiente */}
          {cuentaModal.resumen.deuda_creditos_parciales > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-2">
                <CreditCard size={13} />
                Debes ${fmt(cuentaModal.resumen.deuda_creditos_parciales)} en {cuentaModal.resumen.num_creditos_pendientes} pago(s) a crédito sin liquidar
              </p>
            </div>
          )}

          {/* HISTORIAL DE PAGOS */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                Historial de Pagos
              </h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {cuentaModal.historial_pagos.length === 0 ? (
              <p className="text-center py-8 text-slate-300 font-black text-[10px] uppercase">
                Sin pagos registrados
              </p>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      <th className="p-3 font-black text-[9px] uppercase text-slate-400">Fecha</th>
                      <th className="p-3 font-black text-[9px] uppercase text-slate-400">Concepto</th>
                      <th className="p-3 font-black text-[9px] uppercase text-slate-400">Cuenta</th>
                      <th className="p-3 font-black text-[9px] uppercase text-slate-400">Estado</th>
                      <th className="p-3 font-black text-[9px] uppercase text-slate-400 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cuentaModal.historial_pagos.map((pago: any) => {
                      const esCreditoConfirmado =
                        pago.forma_pago === "credito" && pago.estado === "confirmado";
                      const pendiente = Number(pago.saldo_pendiente ?? 0);
                      const liquidado = pendiente <= 0.01;
                      return (
                        <tr key={pago.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-600 align-top">
                            {new Date(pago.fecha_movimiento).toLocaleDateString("es-MX")}
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-bold text-slate-800 uppercase">{pago.concepto ?? "—"}</p>
                            {pago.remesa_folio && (
                              <p className="text-[9px] text-slate-400 font-bold">HGZ.{pago.remesa_folio}</p>
                            )}
                            {pago.forma_pago && (
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                {pago.forma_pago === "credito"
                                  ? `Crédito ${pago.num_cuotas ? `(${pago.num_cuotas} cuotas)` : "(indefinido)"}`
                                  : "Contado"}
                              </p>
                            )}
                            {esCreditoConfirmado && (
                              <p
                                className={`text-[9px] font-black uppercase mt-0.5 flex items-center gap-1 ${
                                  liquidado ? "text-emerald-600" : "text-amber-600"
                                }`}
                              >
                                <CreditCard size={9} />
                                {liquidado
                                  ? "Liquidado"
                                  : `Abonado $${fmt(Number(pago.monto_abonado))} · Pendiente $${fmt(pendiente)}`}
                              </p>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-500 uppercase align-top">
                            {pago.cuenta_nombre ?? "—"}
                          </td>
                          <td className="p-3 align-top">
                            <span
                              className={`text-[9px] font-black uppercase ${
                                pago.estado === "confirmado" ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {pago.estado}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 align-top">
                            ${fmt(pago.monto)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* HISTORIAL DE ÓRDENES (REMESAS) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                Órdenes de Compra (Remesas)
              </h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {cuentaModal.historial_remesas.length === 0 ? (
              <p className="text-center py-8 text-slate-300 font-black text-[10px] uppercase">
                Sin órdenes registradas
              </p>
            ) : (
              <div className="grid gap-2">
                {cuentaModal.historial_remesas.map((r: any) => (
                  <div
                    key={r.id}
                    className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="font-black text-xs text-slate-900">HGZ.{r.folio}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{r.obra ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                          r.estado === "pagada" || r.estado === "recibida"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.estado}
                      </span>
                      <span className="font-black text-sm text-slate-900">${fmt(r.monto_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <Button
            onClick={() => setCuentaModal(null)}
            className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px]"
          >
            Cerrar
          </Button>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}

// Helpers locales
function InputLabel({ label }: { label: string }) {
  return <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">{label}</label>;
}

// Estilos base de los inputs para evitar repetición
const styles = `
  .form-sigo {
    height: 3rem !important;
    border-radius: 1rem !important;
    border-color: #f1f5f9 !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.025em !important;
  }
  .form-sigo:focus-visible {
    ring-color: rgba(220, 38, 38, 0.1) !important;
    border-color: #e2e8f0 !important;
  }
`;