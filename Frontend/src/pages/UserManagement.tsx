import { useEffect, useState } from "react";
import api from "@/lib/axios";

import {
  ChevronDown,
  Edit2,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  UserCircle,
  Mail,
  ShieldCheck,
  Hash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_STYLES: Record<
  string,
  { label: string; icon: any; class: string }
> = {
  active: {
    label: "Activo",
    icon: CheckCircle2,
    class: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  inactive: {
    label: "Inactivo",
    icon: XCircle,
    class: "text-slate-400 bg-slate-50 border-slate-100",
  },
  suspended: {
    label: "Suspendido",
    icon: AlertCircle,
    class: "text-red-600 bg-red-50 border-red-100",
  },
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-600 text-white border-transparent shadow-sm shadow-red-100",
  residente: "bg-slate-900 text-white border-transparent",
  compras: "bg-blue-50 text-blue-700 border-blue-100",
  rh: "bg-amber-50 text-amber-700 border-amber-100",
  consulta: "bg-slate-50 text-slate-600 border-slate-200",
};

const getRoleStyle = (roleName?: string) =>
  ROLE_STYLES[roleName?.toLowerCase() || ""] ||
  "bg-gray-100 text-gray-600 border-gray-200";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [allObras, setAllObras] = useState(false);
  const [selectedObraIds, setSelectedObraIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
    } catch (err) {
      console.error("Error cargando roles:", err);
    }
  };

const fetchObras = async () => {
  try {
    const res = await api.get("/obras/all"); // 👈 antes era "/obras"
    setObras(res.data);
  } catch (err) {
    console.error("Error cargando obras:", err);
  }
};
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchObras();
  }, []);

  const openEditModal = async (user: any) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: String(user.role_id) });
    setShowModal(true);

    try {
      const res = await api.get(`/users/${user.id}/obras`);
      setAllObras(res.data.all_obras);
      setSelectedObraIds(res.data.obras.map((o: any) => o.id));
    } catch (err) {
      console.error("Error cargando obras del usuario:", err);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || String(u.role_id) === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id: number) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

const handleToggleStatus = async (id: number) => {
  await api.patch(`/users/${id}/toggle-active`);
  fetchUsers();
};
  const toggleObra = (id: number) =>
    setSelectedObraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleResetPassword = async (id: number) => {
    const res = await api.post(`/users/${id}/reset-password`);
    alert("Nueva contraseña: " + res.data.newPassword);
    fetchUsers();
  };

  const handleSaveUser = async () => {
    try {
      let userId = editUser?.id;

      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          name: form.name,
          role_id: Number(form.role),
        });
      } else {
        const res = await api.post("/users", {
          name: form.name,
          email: form.email,
          role_id: Number(form.role),
        });
        userId = res.data.user.id;
      }

      await api.put(`/users/${userId}/obras`, {
        all_obras: allObras,
        obra_ids: allObras ? [] : selectedObraIds,
      });

      setShowModal(false);
      setEditUser(null);
      setForm({ name: "", email: "", role: "" });
      setAllObras(false);
      setSelectedObraIds([]);
      fetchUsers();
    } catch (err) {
      console.error("Error guardando usuario:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-600/10 border-t-red-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Sincronizando Personal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER IMPACTO SIGO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
              <Users size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Control de Personal
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1">
            Gestión de Accesos y Capital Humano - Iliasa
          </p>
        </div>

        <Button
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
          className="relative z-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 border-none outline-none"
        >
          <UserPlus className="mr-2 w-4 h-4" strokeWidth={3} /> Nuevo Usuario
        </Button>
      </div>

      {/* FILTROS INTEGRADOS */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
            <Input
              placeholder="BUSCAR POR NOMBRE O CORREO INSTITUCIONAL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-600 focus-visible:ring-red-600 focus-visible:ring-offset-0 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all outline-none"
            />
          </div>

          <div className="flex gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] h-12 border-slate-100 bg-slate-50/50 rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-red-600 transition-all outline-none">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-slate-400" />
                  <SelectValue placeholder="ROL" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                <SelectItem
                  value="all"
                  className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3 cursor-pointer"
                >
                  Todos los roles
                </SelectItem>
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={String(role.id)}
                    className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3 cursor-pointer"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                  className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3 cursor-pointer"
                >
                  Cualquier Estado
                </SelectItem>
                <SelectItem
                  value="active"
                  className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3 cursor-pointer"
                >
                  Activos
                </SelectItem>
                <SelectItem
                  value="inactive"
                  className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-red-50 focus:text-red-600 py-3 cursor-pointer"
                >
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* TABLA TÉCNICA */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 w-14 pl-10">
                  <Checkbox className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                </th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Colaborador
                </th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Acceso / Rol
                </th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estatus
                </th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((user) => {
                const status =
                  STATUS_STYLES[user.status] || STATUS_STYLES.inactive;
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={user.id}
                    className="group hover:bg-red-50/20 transition-all duration-300"
                  >
                    <td className="p-5 pl-10">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-[10px] shadow-lg shadow-slate-200 group-hover:bg-red-600 transition-colors">
                          {user.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none mb-1 group-hover:text-red-600 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <Badge
                        className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-xl border-none ${getRoleStyle(user.role_name)}`}
                      >
                        {user.role_name}
                      </Badge>
                      {user.all_obras ? (
                        <Badge className="ml-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">
                          Todas
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg">
                          {user.obras?.length || 0} obras
                        </Badge>
                      )}
                    </td>

                    <td className="p-5">
                      <div
                        className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter ${status.class.split(" ")[0]}`}
                      >
                        <StatusIcon size={14} strokeWidth={3} />
                        {status.label}
                      </div>
                    </td>

                    <td className="p-5 text-right pr-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-600 hover:bg-white shadow-sm hover:border-slate-100 border border-transparent transition-all"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl"
                        >
                          <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest gap-3 py-3 rounded-xl cursor-pointer focus:bg-red-50 focus:text-red-600">
                            <Eye size={16} /> Ver Expediente
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => openEditModal(user)}
                            className="text-[10px] font-black uppercase tracking-widest gap-3 py-3 rounded-xl cursor-pointer focus:bg-red-50 focus:text-red-600"
                          >
                            <Edit2 size={16} /> Editar Usuario
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 bg-slate-50" />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user.id)}
                            className="text-[10px] font-black uppercase tracking-widest gap-3 py-3 rounded-xl cursor-pointer focus:bg-red-50 focus:text-red-600"
                          >
                            <Shield size={16} /> Alternar Estado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(user.id)}
                            className="text-[10px] font-black uppercase tracking-widest gap-3 py-3 rounded-xl cursor-pointer focus:bg-red-50 focus:text-red-600"
                          >
                            <Key size={16} /> Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-24 text-center bg-slate-50/30">
            <Users
              className="w-16 h-16 text-slate-100 mx-auto mb-6"
              strokeWidth={1}
            />
            <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.3em]">
              No se encontró personal registrado
            </p>
          </div>
        )}
      </div>

      {/* MODAL EXPEDIENTE SIGO */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/20">
                <UserPlus size={24} strokeWidth={2.5} className="text-white" />
              </div>
              {editUser ? "Editar Perfil" : "Alta de Personal"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nombre Completo
              </Label>
              <div className="relative group">
                <UserCircle
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Correo Institucional
              </Label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors"
                  size={18}
                />
                <Input
                  disabled={!!editUser}
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-bold text-sm shadow-inner transition-all outline-none disabled:opacity-50"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@constructorailiasa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nivel de Acceso (Rol)
              </Label>
              <div className="relative group">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10 group-focus-within:text-red-600 transition-colors"
                  size={18}
                />
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 font-black text-[11px] uppercase tracking-widest transition-all outline-none">
                    <SelectValue placeholder="ASIGNAR ROL" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                    {roles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={String(role.id)}
                        className="font-bold text-xs uppercase tracking-tight py-3 rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer"
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Obras Asignadas
              </Label>

              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <Checkbox
                  checked={allObras}
                  onCheckedChange={(checked) => {
                    setAllObras(!!checked);
                    if (checked) setSelectedObraIds([]);
                  }}
                  className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Acceso a todas las obras
                </span>
              </div>

              {!allObras && (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-3">
                  {obras.map((obra) => (
                    <label
                      key={obra.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50/40 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedObraIds.includes(obra.id)}
                        onCheckedChange={() => toggleObra(obra.id)}
                        className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                        {obra.nombre}
                      </span>
                    </label>
                  ))}
                  {obras.length === 0 && (
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest p-3">
                      No hay obras disponibles
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all outline-none"
            >
              Descartar
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 active:scale-95 transition-all flex gap-2"
            >
              <CheckCircle2 size={16} />
              {editUser ? "Actualizar Perfil" : "Confirmar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
