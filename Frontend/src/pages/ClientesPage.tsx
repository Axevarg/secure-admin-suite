import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building2,
  UserCircle,
  MapPin,
  Fingerprint,
  Briefcase,
  Search,
  Filter,
  Users,
} from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Estados para Filtros
  const [search, setSearch] = useState("");
  const [filterRFC, setFilterRFC] = useState("todos");
  const [filterContacto, setFilterContacto] = useState("todos");

  const [form, setForm] = useState({
    nombre: "",
    razon_social: "",
    rfc: "",
    telefono: "",
    correo: "",
    direccion: "",
    contacto: "",
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const res = await api.get("/clientes");
    setClientes(res.data);
  };

  const openCreate = () => {
    setEditCliente(null);
    setForm({
      nombre: "",
      razon_social: "",
      rfc: "",
      telefono: "",
      correo: "",
      direccion: "",
      contacto: "",
    });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditCliente(c);
    setForm(c);
    setShowModal(true);
  };

  const saveCliente = async () => {
    try {
      setLoading(true);
      if (editCliente) await api.put(`/clientes/${editCliente.id}`, form);
      else await api.post("/clientes", form);
      setShowModal(false);
      loadClientes();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCliente = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await api.delete(`/clientes/${id}`);
    loadClientes();
  };

  // Lógica de Filtrado
  const clientesFiltrados = clientes.filter((c) => {
    const text = search.toLowerCase();
    const matchSearch =
      c.nombre?.toLowerCase().includes(text) ||
      c.razon_social?.toLowerCase().includes(text) ||
      c.rfc?.toLowerCase().includes(text) ||
      c.contacto?.toLowerCase().includes(text);

    const matchRFC =
      filterRFC === "todos" ||
      (filterRFC === "con" && c.rfc) ||
      (filterRFC === "sin" && !c.rfc);

    const matchContacto =
      filterContacto === "todos" ||
      (filterContacto === "con" && c.contacto) ||
      (filterContacto === "sin" && !c.contacto);

    return matchSearch && matchRFC && matchContacto;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Briefcase className="text-red-600" size={22} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Clientes
            </h2>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
            Módulo de Administración Fiscal y Comercial
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={3} /> Nuevo Cliente
        </Button>
      </div>

      {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-96 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
            size={18}
          />
          <Input
            placeholder="Buscar por nombre, RFC o contacto..."
            className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-600 font-bold text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              value={filterRFC}
              onChange={(e) => setFilterRFC(e.target.value)}
              className="pl-9 h-12 w-full lg:w-44 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest appearance-none focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="todos text-slate-400">RFC: Todos</option>
              <option value="con">Con Registro</option>
              <option value="sin">Pendientes</option>
            </select>
          </div>

          <div className="relative flex-1 lg:flex-none">
            <Users
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              value={filterContacto}
              onChange={(e) => setFilterContacto(e.target.value)}
              className="pl-9 h-12 w-full lg:w-44 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest appearance-none focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="todos">Contacto: Todos</option>
              <option value="con">Con Asignación</option>
              <option value="sin">Sin Asignación</option>
            </select>
          </div>
        </div>

        <div className="lg:ml-auto px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {clientesFiltrados.length} Registros Encontrados
          </span>
        </div>
      </div>

      {/* GRID CLIENTES */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientesFiltrados.map((c) => (
          <div
            key={c.id}
            className="group bg-white border border-slate-200/60 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:shadow-red-900/5 transition-all relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[3rem] -mr-8 -mt-8 group-hover:bg-red-50 transition-colors" />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg shadow-slate-200 group-hover:bg-red-600 group-hover:shadow-red-200 transition-all">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(c)}
                  className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Pencil size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCliente(c.id)}
                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>

            <div className="space-y-2 mb-6 relative z-10">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-tight line-clamp-2 min-h-[3rem] group-hover:text-red-600 transition-colors">
                {c.nombre}
              </h3>
              <div className="flex gap-2 items-center">
                <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">
                  {c.rfc || "X-RFC-000"}
                </Badge>
                {!c.contacto && (
                  <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                    Sin Contacto
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-50 relative z-10">
              <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                    <UserCircle size={14} />
                  </div>
                  <span className="truncate">{c.contacto || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                    <Phone size={14} />
                  </div>
                  <span>{c.telefono || "---"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 lowercase tracking-tight italic">
                <Mail size={12} className="text-slate-300" />
                <span className="truncate group-hover:text-slate-600 transition-colors">
                  {c.correo}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/20">
                <Briefcase size={24} strokeWidth={2.5} className="text-white" />
              </div>{" "}
              {editCliente ? "Editar Expediente" : "Alta de Cliente"}
            </DialogTitle>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
              Base de Datos Fiscal - Constructora Iliasa
            </p>
          </DialogHeader>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nombre Comercial
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                RFC / Identificación
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all uppercase"
                value={form.rfc}
                onChange={(e) => setForm({ ...form, rfc: e.target.value })}
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Razón Social Completa
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                value={form.razon_social}
                onChange={(e) =>
                  setForm({ ...form, razon_social: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Teléfono
              </Label>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                value={form.telefono}
                onChange={(e) =>
                  setForm({
                    ...form,
                    telefono: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Email Corporativo
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Domicilio Fiscal
              </Label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={16}
                />
                <Input
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Persona de Contacto / Enlace
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all"
                value={form.contacto}
                onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none"
            >
              Descartar
            </Button>
            <Button
              onClick={saveCliente}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all"
            >
              {loading
                ? "Sincronizando..."
                : editCliente
                  ? "Actualizar Registro"
                  : "Confirmar Alta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
