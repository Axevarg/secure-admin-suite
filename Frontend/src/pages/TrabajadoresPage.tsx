import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Phone,
  Mail,
  Filter,
  HardHat,
  Hash,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function TrabajadoresPage() {
  const [data, setData] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    especialidad_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trabajadores, especialidadesRes] = await Promise.all([
        api.get("/trabajadores"),
        api.get("/especialidades"),
      ]);
      setData(trabajadores.data);
      setEspecialidades(especialidadesRes.data);
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ nombre: "", telefono: "", correo: "", especialidad_id: "" });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      nombre: item.nombre,
      telefono: item.telefono || "",
      correo: item.correo || "",
      especialidad_id: String(item.especialidad_id),
    });
    setShowModal(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        especialidad_id: Number(form.especialidad_id),
      };
      if (editItem) await api.put(`/trabajadores/${editItem.id}`, payload);
      else await api.post("/trabajadores", payload);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar trabajador del sistema?")) return;
    await api.delete(`/trabajadores/${id}`);
    loadData();
  };

  const toggleActivo = async (item: any) => {
    await api.put(`/trabajadores/${item.id}`, {
      ...item,
      activo: !item.activo,
    });
    loadData();
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.nombre.toLowerCase().includes(search.toLowerCase()) ||
      item.correo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.activo) ||
      (statusFilter === "inactive" && !item.activo);
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
              <HardHat size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Trabajadores
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1">
            Fuerza Operativa y Especialistas - Iliasa
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 border-none outline-none"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={3} /> Alta de Trabajador
        </Button>
      </div>

      {/* FILTROS TÉCNICOS */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
            <Input
              placeholder="BUSCAR POR NOMBRE, CORREO O TELÉFONO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-600 focus-visible:ring-red-600 focus-visible:ring-offset-0 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all outline-none"
            />
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-12 border-slate-100 bg-slate-50/50 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-red-600 transition-all outline-none">
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
                  Cualquier Estado
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
      </div>

      {/* TABLA DE TRABAJADORES */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-10">
                Colaborador
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Contacto
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Especialidad
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Estatus
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-10">
                Gestión
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.map((t) => (
              <TableRow
                key={t.id}
                className="group border-b border-slate-50 hover:bg-red-50/20 transition-all duration-300"
              >
                <TableCell className="p-5 pl-10">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-red-600 transition-colors">
                      {t.nombre}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      ID: {String(t.id).padStart(3, "0")}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                      <Phone size={12} className="text-red-600/50" />{" "}
                      {t.telefono || "Sin teléfono"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-tight lowercase">
                      <Mail size={12} className="text-slate-300" />{" "}
                      {t.correo || "Sin correo"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-5">
                  <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-xl border-none">
                    {t.especialidad || "General"}
                  </Badge>
                </TableCell>

                <TableCell className="p-5">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={t.activo}
                      onCheckedChange={() => toggleActivo(t)}
                      className="data-[state=checked]:bg-red-600"
                    />
                    <span
                      className={`font-black text-[9px] uppercase tracking-widest ${t.activo ? "text-emerald-600" : "text-slate-300"}`}
                    >
                      {t.activo ? "En Servicio" : "Inactivo"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right pr-10 py-5">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(t)}
                      className="h-9 w-9 rounded-xl hover:bg-white hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(t.id)}
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
        {filteredData.length === 0 && (
          <div className="p-24 text-center bg-slate-50/30">
            <HardHat
              className="mx-auto text-slate-100 mb-6"
              size={56}
              strokeWidth={1}
            />
            <p className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-300">
              No se encontraron trabajadores en el registro
            </p>
          </div>
        )}
      </div>

      {/* MODAL EXPEDIENTE TRABAJADOR */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl">
                <HardHat size={24} className="text-white" strokeWidth={2.5} />
              </div>
              {editItem ? "Editar Perfil" : "Nuevo Trabajador"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nombre Completo
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="EJ. JUAN ANTONIO VARGAS"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Teléfono
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
                  Correo (Opcional)
                </Label>
                <Input
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Especialidad Operativa
              </Label>
              <Select
                value={String(form.especialidad_id)}
                onValueChange={(v) => setForm({ ...form, especialidad_id: v })}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-black text-[10px] uppercase tracking-widest outline-none">
                  <SelectValue placeholder="SELECCIONAR ESPECIALIDAD" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                  {especialidades.map((e) => (
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
          </div>

          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            >
              Cancelar
            </Button>
            <Button
              onClick={save}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all outline-none focus-visible:ring-0"
            >
              Confirmar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
