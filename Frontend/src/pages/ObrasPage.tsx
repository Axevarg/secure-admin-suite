import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";

import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  User,
  Calendar,
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { Badge } from "@/components/ui/badge";

export default function Obras() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editObra, setEditObra] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const navigate = useNavigate();

  const canEdit = permissions.includes("obras:edit");
  const canDelete = permissions.includes("obras:delete");
  const canCreate = permissions.includes("obras:create");

  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "",
    cliente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    descripcion: "",
    status_id: 1,
  });

  useEffect(() => {
    const storage = localStorage.getItem("permissions")
      ? localStorage
      : sessionStorage;
    const stored = storage.getItem("permissions");
    if (stored) setPermissions(JSON.parse(stored));

    loadData(); // 👈 faltaba esto
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [obrasRes, clientesRes, statusRes] = await Promise.all([
        api.get("/obras"),
        api.get("/clientes"),
        api.get("/obras/project-status"),
      ]);

      setObras(obrasRes.data);
      setClientes(clientesRes.data);
      setStatuses(statusRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditObra(null);
    setForm({
      nombre: "",
      ubicacion: "",
      cliente_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      descripcion: "",
      status_id: 1,
    });
    setShowModal(true);
  };

  const openEdit = (o: any) => {
    setEditObra(o);
    setForm({
      nombre: o.nombre,
      ubicacion: o.ubicacion,
      cliente_id: o.cliente_id,
      fecha_inicio: o.fecha_inicio ? o.fecha_inicio.substring(0, 10) : "",
      fecha_fin: o.fecha_fin ? o.fecha_fin.substring(0, 10) : "",
      descripcion: o.descripcion || "",
      status_id: o.status_id,
    });
    setShowModal(true);
  };

  const saveObra = async () => {
    try {
      if (editObra) await api.put(`/obras/${editObra.id}`, form);
      else await api.post("/obras", form);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteObra = async (id: number) => {
    if (!confirm("¿Eliminar obra?")) return;
    await api.delete(`/obras/${id}`);
    loadData();
  };

  const obrasFiltradas = obras.filter((o) => {
    const text = search.toLowerCase();
    const matchSearch =
      o.nombre?.toLowerCase().includes(text) ||
      o.ubicacion?.toLowerCase().includes(text) ||
      o.cliente_nombre?.toLowerCase().includes(text);
    const matchEstado =
      estadoFiltro === "todos" || o.status_name === estadoFiltro;
    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER IMPACTO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Proyectos / Obras
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80">
            Control de infraestructura y cronogramas Iliasa
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={openCreate}
            className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 outline-none focus-visible:ring-0"
          >
            <Plus className="mr-2 w-4 h-4" strokeWidth={3} /> Nueva Obra
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-96 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
            size={18}
          />
          <Input
            placeholder="Buscar obra, ubicación o cliente..."
            className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-600 font-bold text-sm transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative w-full lg:w-48">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={14}
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="pl-9 h-12 w-full rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest appearance-none focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="En progreso">En progreso</option>
            <option value="Pausada">Pausada</option>
            <option value="Terminada">Terminada</option>
          </select>
        </div>

        <div className="lg:ml-auto px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {obrasFiltradas.length} Proyectos activos
          </span>
        </div>
      </div>

      {/* GRID OBRAS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {obrasFiltradas.map((o) => (
          <div
            key={o.id}
            onClick={() => navigate(`/obras/${o.id}/dashboard`)}
            className="group bg-white border cursor-pointer border-slate-200/60 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:shadow-red-900/5 transition-all relative flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-900 text-white p-3 rounded-2xl group-hover:bg-red-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-red-200">
                <ClipboardList size={24} strokeWidth={2.5} />
              </div>
              <div className="flex gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation(); // ← Esto es lo importante
                      openEdit(o);
                    }}
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                  >
                    <Pencil size={18} />
                  </Button>
                )}

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation(); // ← Esto es lo importante
                      deleteObra(o.id);
                    }}
                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-tight line-clamp-2 min-h-[3rem] group-hover:text-red-600 transition-colors">
                {o.nombre}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  style={{
                    backgroundColor: o.status_color + "20",
                    color: o.status_color,
                  }}
                  className="border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest"
                >
                  {o.status_name}
                </Badge>
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:text-red-500 transition-colors">
                  <User size={14} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-tight truncate">
                  {o.cliente_nombre || "Sin cliente"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:text-red-500 transition-colors">
                  <MapPin size={14} />
                </div>
                <span className="text-[11px] font-bold truncate">
                  {o.ubicacion}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ESTADO VACÍO */}
      {!loading && obrasFiltradas.length === 0 && (
        <div className="p-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Building2
            className="w-16 h-16 text-slate-100 mx-auto mb-6"
            strokeWidth={1}
          />
          <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.3em]">
            {obras.length === 0
              ? "No tienes ninguna obra asignada"
              : "No se encontraron obras con ese filtro"}
          </p>
        </div>
      )}

      {/* MODAL EXPEDIENTE DE OBRA */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter">
              {editObra ? "Actualizar Proyecto" : "Registro de Obra"}
            </DialogTitle>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
              Ficha técnica y logística - Iliasa
            </p>
          </DialogHeader>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nombre del Proyecto
              </Label>
              <Input
                maxLength={100}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Cliente Responsable
              </Label>
              <select
                value={form.cliente_id}
                onChange={(e) =>
                  setForm({ ...form, cliente_id: e.target.value })
                }
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none transition-all appearance-none"
              >
                <option value="">Seleccionar Cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Estado Operativo
              </Label>
              <select
                value={form.status_id}
                onChange={(e) =>
                  setForm({ ...form, status_id: Number(e.target.value) })
                }
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none transition-all appearance-none"
              >
                <option value="">Seleccionar estado...</option>

                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Ubicación / Georeferencia
              </Label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={16}
                />
                <Input
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={form.ubicacion}
                  onChange={(e) =>
                    setForm({ ...form, ubicacion: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Fecha Estimada Inicio
              </Label>
              <Input
                type="date"
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-sm outline-none focus-visible:ring-0"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Fecha Estimada Fin
              </Label>
              <Input
                type="date"
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-sm outline-none focus-visible:ring-0"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Alcance / Descripción del Proyecto
              </Label>
              <Input
                className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
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
              onClick={saveObra}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all outline-none focus-visible:ring-0"
            >
              {editObra ? "Actualizar Proyecto" : "Confirmar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
