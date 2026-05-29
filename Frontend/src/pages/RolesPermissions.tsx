import { useState, useEffect } from "react";
import {
  Edit2,
  Info,
  Plus,
  Shield,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldCheck,
  AlertCircle, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MODULES = [
  "dashboard",
  "obras",
  "clientes",
  "trabajadores",
  "contratistas",
  "especialidades",
  "proveedores",
  "usuarios",
  "obra_dashboard",
  "asistencia",
  "presupuesto",
  "requisiciones",
  "compras",
  "recepcion_material",
  "evidencias",
  "aprobaciones",
  "remesas"
];

const PERMISSIONS = [
  { key: "view", label: "Ver" },
  { key: "create", label: "Crear" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Borrar" },
  { key: "approve", label: "Aprobar" },
  { key: "manage", label: "Gestionar" },
];

export default function RolesPermissions() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
      if (res.data.length) selectRole(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const selectRole = async (role: any) => {
    setSelectedRole(role);
    setEditMode(false);
    try {
      const res = await api.get(`/roles/${role.id}/permissions`);
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const hasPermission = (module: string, perm: string) => {
    return permissions.includes(`${module}:${perm}`);
  };

  const togglePermission = (module: string, perm: string) => {
    if (!editMode) return;
    const key = `${module}:${perm}`;
    setPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((p) => p !== key)
        : [...prev, key]
    );
  };

  const toggleAllModule = (module: string) => {
    if (!editMode) return;
    const modulePerms = PERMISSIONS.map((p) => `${module}:${p.key}`);
    const allSelected = modulePerms.every((p) => permissions.includes(p));

    if (allSelected) {
      setPermissions((prev) => prev.filter((p) => !p.startsWith(module)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...modulePerms])]);
    }
  };

  if (!selectedRole) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Control de Accesos</h2>
          <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
            <Lock size={14} className="text-red-600" />
            Gestionando privilegios para {roles.length} niveles jerárquicos
          </p>
        </div>

        <Button
          onClick={() => setShowNewRole(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-100 uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Rol
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">

        {/* LISTA DE ROLES (Sidebar Izquierda) */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Niveles Definidos</p>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${selectedRole.id === role.id
                    ? "border-red-600 bg-red-50 shadow-md shadow-red-100/50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole.id === role.id ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      <Shield size={16} />
                    </div>
                    <span className={`text-sm font-black uppercase tracking-tight ${selectedRole.id === role.id ? "text-red-700" : "text-slate-600"}`}>
                      {role.name}
                    </span>
                  </div>
                  {selectedRole.id === role.id && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MATRIZ DE PERMISOS (Panel Principal) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

          {/* BARRA DE ACCIONES DEL ROL */}
          <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-red-600" size={20} />
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Privilegios: {selectedRole.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajuste de permisos por módulo</p>
              </div>
            </div>

            {editMode ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditMode(false)} className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await api.put(`/roles/${selectedRole.id}/permissions`, { permissions });
                      setEditMode(false);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl px-6 text-[10px] uppercase tracking-widest h-10 shadow-md shadow-green-100"
                >
                  Guardar Cambios
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl px-6 text-[10px] uppercase tracking-widest h-10 shadow-md shadow-slate-200"
              >
                <Edit2 className="w-3.5 h-3.5 mr-2" />
                Modificar Permisos
              </Button>
            )}
          </div>

          {editMode && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-700 animate-pulse">
              <AlertCircle size={16} strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest">Modo Edición Activo: Los cambios afectarán a todos los usuarios con este rol.</p>
            </div>
          )}

          {/* TABLA DE MATRIZ */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">Módulo del Sistema</th>
                  {PERMISSIONS.map((p) => (
                    <th key={p.key} className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.label}</th>
                  ))}
                  <th className="p-4 text-center text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Todo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {MODULES.map((module) => {
                  const allSelected = PERMISSIONS.every((p) => hasPermission(module, p.key));

                  return (
                    <tr key={module} className={`transition-colors ${editMode ? "hover:bg-slate-50/50" : ""}`}>
                      <td className="p-4 pl-8">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{module}</span>
                      </td>

                      {PERMISSIONS.map((p) => (
                        <td key={p.key} className="p-4 text-center">
                          <Checkbox
                            checked={hasPermission(module, p.key)}
                            onCheckedChange={() => togglePermission(module, p.key)}
                            disabled={!editMode}
                            // 🔥 CORRECCIÓN AQUÍ: Forzamos el color rojo corporativo cuando está checked
                            className={`mx-auto border-2 border-slate-200 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600`}
                          />
                        </td>
                      ))}

                      <td className="p-4 text-center bg-slate-50/30">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleAllModule(module)}
                          disabled={!editMode}
                          // 🔥 CORRECCIÓN AQUÍ: Forzamos el color negro corporativo para la columna "Todo"
                          className={`mx-auto border-2 border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL NUEVO ROL */}
      <Dialog open={showNewRole} onOpenChange={setShowNewRole}>
        <DialogContent className="max-w-xl p-0 border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
          {/* ENCABEZADO ESTILO SIGO (OSCURO) */}
          <DialogHeader className="p-10 bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <DialogTitle className="font-black text-3xl uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/20">
                <KeyRound size={24} strokeWidth={2.5} className="text-white" />
              </div>
              Nuevo Nivel de Acceso
            </DialogTitle>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-3 opacity-60">
              Jerarquía de Permisos - Constructora Iliasa
            </p>
          </DialogHeader>

          {/* CUERPO DEL FORMULARIO */}
          <div className="p-10 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Nombre del Rol / Cargo
              </Label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <Input
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-red-600 focus-visible:ring-red-600 focus-visible:ring-offset-0 font-bold text-sm shadow-inner transition-all outline-none"
                  placeholder="Ej. Residente de Obra Especializado"
                />
              </div>
            </div>
          </div>

          {/* PIE DE MODAL (SIN TRANSICIÓN AZUL) */}
          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowNewRole(false)}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none"
            >
              Descartar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 rounded-2xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 focus-visible:ring-red-600 focus-visible:ring-offset-0 active:scale-95 transition-all flex gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              Crear Nivel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}