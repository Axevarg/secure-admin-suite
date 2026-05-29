import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { 
  Plus, Pencil, Trash2, Wrench, 
  Search, Hash, FileText, Filter, 
  ChevronDown 
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

export default function EspecialidadesPage() {
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  
  // ESTADOS DE FILTRO
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/especialidades");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ nombre: "", descripcion: "" });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm(item);
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editItem) await api.put(`/especialidades/${editItem.id}`, form);
      else await api.post("/especialidades", form);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar especialidad?")) return;
    await api.delete(`/especialidades/${id}`);
    loadData();
  };

  // LÓGICA DE FILTRADO DINÁMICO
  const filteredData = data.filter((item) => {
    const matchesSearch = item.nombre.toLowerCase().includes(search.toLowerCase()) ||
                          item.descripcion?.toLowerCase().includes(search.toLowerCase());
    
    // Suponiendo que las especialidades tengan un campo 'activo' (booleano o string)
    // Si no lo tienen aún, esto queda listo para cuando lo implementes en DB
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && item.activo) || 
                          (statusFilter === "inactive" && !item.activo);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER IMPACTO SIGO */}
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <Wrench size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Especialidades</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1">
            Catálogo Operativo de Ingeniería - Iliasa
          </p>
        </div>

        <Button 
          onClick={openCreate} 
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 focus-visible:ring-0 outline-none border-none"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={3} /> Nueva Especialidad
        </Button>
      </div>

      {/* BARRA DE FILTROS ESTILO SIGO */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
            <Input
              placeholder="BUSCAR POR NOMBRE O DESCRIPCIÓN TÉCNICA..."
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
                <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3">Todos los estados</SelectItem>
                <SelectItem value="active" className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3">Activos</SelectItem>
                <SelectItem value="inactive" className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden lg:flex items-center px-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {filteredData.length} REGISTROS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA TÉCNICA */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-10">
                <div className="flex items-center gap-2"><Hash size={14}/> ID</div>
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Especialidad Operativa
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <div className="flex items-center gap-2"><FileText size={14}/> Alcance / Descripción</div>
              </TableHead>
              <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-10">
                Gestión
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((e) => (
              <TableRow key={e.id} className="group border-b border-slate-50 hover:bg-red-50/20 transition-all duration-300">
                <TableCell className="pl-10 py-5">
                  <span className="font-black text-slate-300 group-hover:text-red-600/50 transition-colors text-xs">
                    #{String(e.id).padStart(3, '0')}
                  </span>
                </TableCell>
                <TableCell className="py-5">
                  <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-red-600 transition-colors">
                    {e.nombre}
                  </span>
                </TableCell>
                <TableCell className="py-5 max-w-md">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {e.descripcion || "DOCUMENTACIÓN PENDIENTE"}
                  </p>
                </TableCell>
                <TableCell className="text-right pr-10 py-5">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEdit(e)} 
                      className="h-9 w-9 rounded-xl hover:bg-white hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100 focus-visible:ring-0 outline-none"
                    >
                      <Pencil size={14} strokeWidth={2.5}/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(e.id)} 
                      className="h-9 w-9 rounded-xl hover:bg-white hover:text-red-600 shadow-sm border border-transparent hover:border-red-100 focus-visible:ring-0 outline-none"
                    >
                      <Trash2 size={14} strokeWidth={2.5}/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredData.length === 0 && (
          <div className="p-24 text-center bg-slate-50/30">
            <Wrench className="mx-auto text-slate-100 mb-6" size={56} strokeWidth={1} />
            <p className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-300">No se encontraron registros bajo estos criterios</p>
          </div>
        )}
      </div>

      {/* MODAL (SIN CAMBIOS AZULES) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl">
                <Wrench size={24} className="text-white" strokeWidth={2.5} />
              </div>
              {editItem ? "Editar Perfil" : "Alta Técnica"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre de la Especialidad</Label>
              <Input 
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 focus-visible:ring-red-600 focus-visible:ring-offset-0 font-bold text-sm shadow-inner transition-all outline-none" 
                value={form.nombre}
                onChange={(e)=>setForm({...form, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción / Alcance</Label>
              <textarea 
                className="w-full p-4 min-h-[120px] rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none resize-none" 
                value={form.descripcion}
                onChange={(e)=>setForm({...form, descripcion: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button variant="ghost" onClick={()=>setShowModal(false)} className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-0 outline-none transition-all">
              Descartar
            </Button>
            <Button onClick={save} className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all outline-none focus-visible:ring-0">
              Confirmar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}