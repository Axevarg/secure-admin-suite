import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Users2,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  Briefcase,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function ContratistasPage() {
  const [data, setData] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    telefono: "",
    correo: "",
    especialidad_id: 0,
    activo: true,
  });

  // ---- ESTADO TRABAJADORES DE CONTRATISTA ----
  const [showTrabajadoresModal, setShowTrabajadoresModal] = useState(false);
  const [contratistaActivo, setContratistaActivo] = useState<any>(null);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [editTrabajador, setEditTrabajador] = useState<any>(null);
  const [trabajadorForm, setTrabajadorForm] = useState({
    nombre: "",
    puesto: "",
    telefono: "",
    curp: "",
  });

  useEffect(() => {
    loadData();
    loadEspecialidades();
  }, []);

  const loadData = async () => {
    const res = await api.get("/contratistas");
    setData(res.data);
  };

  const loadEspecialidades = async () => {
    const res = await api.get("/especialidades");
    setEspecialidades(res.data.filter((e: any) => e.activo));
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({
      nombre: "",
      empresa: "",
      telefono: "",
      correo: "",
      especialidad_id: 0,
      activo: true,
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      ...item,
      especialidad_id: item.especialidad_id || 0,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (editItem) await api.put(`/contratistas/${editItem.id}`, form);
    else await api.post("/contratistas", form);

    setShowModal(false);
    loadData();
  };

  const remove = async (id: number) => {
    if (!confirm("¿Desactivar contratista?")) return;
    await api.delete(`/contratistas/${id}`);
    loadData();
  };

  // ---- FUNCIONES TRABAJADORES DE CONTRATISTA ----
  const openTrabajadores = async (contratista: any) => {
    setContratistaActivo(contratista);
    setEditTrabajador(null);
    setTrabajadorForm({ nombre: "", puesto: "", telefono: "", curp: "" });
    setShowTrabajadoresModal(true);
    await loadTrabajadores(contratista.id);
  };

  const loadTrabajadores = async (contratistaId: number) => {
    const res = await api.get(`/contratistas/${contratistaId}/trabajadores`);
    setTrabajadores(res.data);
  };

  const saveTrabajador = async () => {
    if (!contratistaActivo) return;

    if (editTrabajador) {
      await api.put(
        `/contratistas/${contratistaActivo.id}/trabajadores/${editTrabajador.id}`,
        { ...trabajadorForm, activo: true }
      );
    } else {
      await api.post(
        `/contratistas/${contratistaActivo.id}/trabajadores`,
        trabajadorForm
      );
    }

    setEditTrabajador(null);
    setTrabajadorForm({ nombre: "", puesto: "", telefono: "", curp: "" });
    await loadTrabajadores(contratistaActivo.id);
    loadData(); // refresca el contador en la tabla principal
  };

  const editingTrabajador = (t: any) => {
    setEditTrabajador(t);
    setTrabajadorForm({
      nombre: t.nombre,
      puesto: t.puesto || "",
      telefono: t.telefono || "",
      curp: t.curp || "",
    });
  };

  const cancelEditTrabajador = () => {
    setEditTrabajador(null);
    setTrabajadorForm({ nombre: "", puesto: "", telefono: "", curp: "" });
  };

  const removeTrabajador = async (id: number) => {
    if (!confirm("¿Desactivar trabajador?")) return;
    await api.delete(`/contratistas/${contratistaActivo.id}/trabajadores/${id}`);
    await loadTrabajadores(contratistaActivo.id);
    loadData();
  };

  const filtered = data.filter((c: any) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.activo) ||
      (statusFilter === "inactive" && !c.activo);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SIGO STYLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <ShieldCheck size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Contratistas
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1">
            Directorio de Proveedores Externos y Empresas
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all border-none outline-none"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={3} /> Alta de Contratista
        </Button>
      </div>

      {/* FILTROS TÉCNICOS */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
            <Input
              placeholder="BUSCAR POR NOMBRE O RAZÓN SOCIAL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-600 focus-visible:ring-red-600 focus-visible:ring-offset-0 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all outline-none"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-12 border-slate-100 bg-slate-50/50 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-red-600 transition-all outline-none">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <SelectValue placeholder="ESTADO" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
              <SelectItem
                value="all"
                className="font-black text-[10px] uppercase tracking-widest rounded-xl py-3 cursor-pointer"
              >
                Todos
              </SelectItem>
              <SelectItem
                value="active"
                className="font-black text-[10px] uppercase tracking-widest rounded-xl py-3 cursor-pointer"
              >
                Activos
              </SelectItem>
              <SelectItem
                value="inactive"
                className="font-black text-[10px] uppercase tracking-widest rounded-xl py-3 cursor-pointer"
              >
                Inactivos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLA DE CONTRATISTAS */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-10">
                Entidad / Empresa
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Representante
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Especialidad
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Contacto
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Personal
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-10">
                Gestión
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((c: any) => (
              <TableRow
                key={c.id}
                className="group border-b border-slate-50 hover:bg-red-50/20 transition-all duration-300"
              >
                <TableCell className="p-5 pl-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                      <Building2 size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                        {c.empresa || "P. FÍSICA"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tracking-tighter">
                        REF: CT-{String(c.id).padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-5">
                  <p className="font-bold text-slate-600 text-[11px] uppercase tracking-wide">
                    {c.nombre}
                  </p>
                </TableCell>

                <TableCell className="p-5">
                  <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-xl border-none">
                    {c.especialidad || "General"}
                  </Badge>
                </TableCell>

                <TableCell className="p-5 text-[11px]">
                  <div className="flex flex-col gap-1 font-bold uppercase tracking-tighter text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Phone size={12} className="text-red-600" /> {c.telefono}
                    </span>
                    <span className="flex items-center gap-1.5 lowercase text-slate-400 tracking-normal font-medium">
                      <Mail size={12} /> {c.correo}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="p-5">
                  <button
                    onClick={() => openTrabajadores(c)}
                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Users2 size={12} strokeWidth={2.5} />
                    {c.trabajadores_count || 0} Trabajadores
                  </button>
                </TableCell>

                <TableCell className="text-right pr-10 py-5">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      className="h-9 w-9 rounded-xl hover:bg-white hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(c.id)}
                      className="h-9 w-9 rounded-xl hover:bg-white hover:text-red-600 shadow-sm border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center p-24 text-center bg-slate-50/30">
            <div className="bg-slate-100 p-6 rounded-[2rem] mb-6">
              <Building2 className="text-slate-200" size={48} strokeWidth={1} />
            </div>
            <h3 className="font-black text-[12px] uppercase tracking-[0.4em] text-slate-400">
              Sin registros encontrados
            </h3>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">
              No hay contratistas que coincidan con los criterios de búsqueda
            </p>
          </div>
        )}
      </div>

      {/* MODAL EXPEDIENTE CONTRATISTA */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl">
                <Building2 size={24} className="text-white" strokeWidth={2.5} />
              </div>
              {editItem ? "Editar Perfil" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Razón Social / Empresa
                </Label>
                <Input
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                  value={form.empresa}
                  onChange={(e) =>
                    setForm({ ...form, empresa: e.target.value })
                  }
                  placeholder="CONSTRUCTORA S.A."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Nombre Representante
                </Label>
                <Input
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="NOMBRE DEL CONTACTO"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Teléfono Directo
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
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
                  Correo Electrónico
                </Label>
                <Input
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Especialidad del Proveedor
                </Label>
                <Select
                  value={String(form.especialidad_id)}
                  onValueChange={(v) =>
                    setForm({ ...form, especialidad_id: Number(v) })
                  }
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-black text-[10px] uppercase tracking-widest outline-none">
                    <SelectValue placeholder="SELECCIONAR ESPECIALIDAD" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    {especialidades.map((e: any) => (
                      <SelectItem
                        key={e.id}
                        value={String(e.id)}
                        className="font-black text-[10px] uppercase tracking-widest rounded-xl py-3 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                      >
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editItem && (
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
                      Estado del Contratista
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                      Activa o desactiva
                    </span>
                  </div>
                  <Switch
                    checked={form.activo}
                    onCheckedChange={(v) => setForm({ ...form, activo: v })}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
             className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={save}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all outline-none"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TRABAJADORES DEL CONTRATISTA */}
      <Dialog open={showTrabajadoresModal} onOpenChange={setShowTrabajadoresModal}>
        <DialogContent className="max-w-2xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-2xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl">
                <Users2 size={22} className="text-white" strokeWidth={2.5} />
              </div>
              Trabajadores de {contratistaActivo?.empresa || contratistaActivo?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-6 bg-white">
            {/* FORM AGREGAR / EDITAR */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Nombre
                </Label>
                <Input
                  className="h-11 rounded-xl border-slate-100 bg-white font-bold text-sm outline-none focus-visible:ring-0"
                  value={trabajadorForm.nombre}
                  onChange={(e) =>
                    setTrabajadorForm({ ...trabajadorForm, nombre: e.target.value })
                  }
                  placeholder="Nombre del trabajador"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Puesto
                </Label>
                <Input
                  className="h-11 rounded-xl border-slate-100 bg-white font-bold text-sm outline-none focus-visible:ring-0"
                  value={trabajadorForm.puesto}
                  onChange={(e) =>
                    setTrabajadorForm({ ...trabajadorForm, puesto: e.target.value })
                  }
                  placeholder="Ej. Albañil, Electricista"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Teléfono
                </Label>
                <Input
                  className="h-11 rounded-xl border-slate-100 bg-white font-bold text-sm outline-none focus-visible:ring-0"
                  value={trabajadorForm.telefono}
                  onChange={(e) =>
                    setTrabajadorForm({
                      ...trabajadorForm,
                      telefono: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  CURP
                </Label>
                <Input
                  className="h-11 rounded-xl border-slate-100 bg-white font-bold text-sm outline-none focus-visible:ring-0 uppercase"
                  value={trabajadorForm.curp}
                  onChange={(e) =>
                    setTrabajadorForm({
                      ...trabajadorForm,
                      curp: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={18}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3">
                {editTrabajador && (
                  <Button
                    variant="ghost"
                    onClick={cancelEditTrabajador}
                    className="font-black text-[10px] uppercase tracking-widest text-slate-400"
                  >
                    Cancelar edición
                  </Button>
                )}
                <Button
                  onClick={saveTrabajador}
                  disabled={!trabajadorForm.nombre}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-6 rounded-xl uppercase tracking-widest text-[10px] h-11 disabled:opacity-40"
                >
                  {editTrabajador ? "Actualizar" : "Agregar Trabajador"}
                </Button>
              </div>
            </div>

            {/* LISTA DE TRABAJADORES */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {trabajadores.length === 0 && (
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 py-10">
                  Sin trabajadores registrados
                </p>
              )}

              {trabajadores.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/60 transition-all"
                >
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                      {t.nombre}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {t.puesto || "Sin puesto"} {t.telefono && `· ${t.telefono}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editingTrabajador(t)}
                      className="h-8 w-8 rounded-lg hover:bg-white hover:text-slate-900"
                    >
                      <Pencil size={13} strokeWidth={2.5} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTrabajador(t.id)}
                      className="h-8 w-8 rounded-lg hover:bg-white hover:text-red-600"
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50">
            <Button
              variant="ghost"
              onClick={() => setShowTrabajadoresModal(false)}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}