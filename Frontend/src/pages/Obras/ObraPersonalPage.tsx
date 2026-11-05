import { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import {
    Plus, Trash2, Users, Building2,
    HardHat, Construction, Search,
    FilterX, ChevronDown, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ObraPersonalPage() {
    const { id } = useParams();

    const [trabajadores, setTrabajadores] = useState([]);
    const [asigTrab, setAsigTrab] = useState<any[]>([]);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [nuevaUnidad, setNuevaUnidad] = useState("");
    const [contratistasDisponibles, setContratistasDisponibles] = useState<any[]>([]);

    // Estados para búsqueda y filtros (personal interno)
    const [searchTrab, setSearchTrab] = useState("");
    const [filterRol, setFilterRol] = useState("all");

    // Estados para el picker de contratistas
    const [searchCont, setSearchCont] = useState("");
    const [expandido, setExpandido] = useState<number | null>(null);

    const [modalTrab, setModalTrab] = useState(false);
    const [modalAsignarContratista, setModalAsignarContratista] = useState(false);
    const [unidadContratista, setUnidadContratista] = useState("");

    const [formTrab, setFormTrab] = useState({
        trabajador_id: "",
        unidad_id: "",
        fecha_inicio: "",
        rol: ""
    });

    useEffect(() => { loadAll(); }, [id]);

    const loadAll = async () => {
        try {
            const [t1, t3, t5, t6] = await Promise.all([
                api.get("/trabajadores/disponibles"),
                api.get(`/obras/${id}/trabajadores`),
                api.get(`/obras/${id}/contratistas-disponibles`),
                api.get(`/obras/${id}/unidades`),
            ]);
            setTrabajadores(t1.data);
            setAsigTrab(t3.data);
            setContratistasDisponibles(t5.data);
            setUnidades(t6.data.unidades || []);
        } catch (err) {
            console.error("Error cargando personal:", err);
        }
    };

    // ---- Personal interno ----
    const filteredTrab = asigTrab.filter((a: any) => {
        const esInterno = a.origen === "interno";
        const matchesSearch = a.nombre.toLowerCase().includes(searchTrab.toLowerCase());
        const matchesRol = filterRol === "all" || a.rol === filterRol;
        return esInterno && matchesSearch && matchesRol;
    });

    const trabajadoresPorUnidad = unidades.map((unidad: any) => ({
        unidad,
        trabajadores: filteredTrab.filter((trabajador: any) => Number(trabajador.unidad_id) === Number(unidad.id)),
    })).filter((grupo: any) => grupo.trabajadores.length > 0);

    const asignarTrabajador = async () => {
        if (!formTrab.trabajador_id) {
            alert("Selecciona un trabajador");
            return;
        }

        try {
            await api.post(`/obras/${id}/trabajadores`, {
                ...formTrab,
                trabajador_id: Number(formTrab.trabajador_id),
                unidad_id: Number(formTrab.unidad_id),
            });
            setModalTrab(false);
            setFormTrab({ trabajador_id: "", unidad_id: "", fecha_inicio: "", rol: "" });
            await loadAll();
        } catch (error: any) {
            alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "No fue posible asignar el trabajador"
            );
        }
    };

    const crearUnidad = async () => {
        const nombre = nuevaUnidad.trim();
        if (!nombre) return;
        try {
            await api.post(`/obras/${id}/unidades`, { nombre });
            setNuevaUnidad("");
            await loadAll();
        } catch (error: any) {
            alert(error.response?.data?.message || "No fue posible crear la unidad");
        }
    };

    const cambiarUnidadTrabajador = async (asignacion: any, unidadId: string) => {
        try {
            await api.put(`/asignaciones/trabajadores/${asignacion.id}`, {
                fecha_fin: asignacion.fecha_fin,
                rol: asignacion.rol,
                activo: asignacion.activo,
                unidad_id: Number(unidadId),
            });
            await loadAll();
        } catch (error: any) {
            alert(error.response?.data?.error || error.response?.data?.message || "No fue posible cambiar la unidad");
        }
    };

    const quitarTrabajador = async (asigId: number) => {
        if (!confirm("¿Retirar de esta obra?")) return;
        await api.delete(`/asignaciones/trabajadores/${asigId}`);
        loadAll();
    };

    // ---- Personal de contratistas (agrupado) ----
    const asigContratista = asigTrab.filter((a: any) => a.origen === "contratista");

    const gruposContratistasPorUnidad = unidades.map((unidad: any) => ({
        unidad,
        trabajadores: asigContratista.filter((trabajador: any) => Number(trabajador.unidad_id) === Number(unidad.id)),
    })).filter((grupo: any) => grupo.trabajadores.length > 0);

    const toggleTrabajadorContratista = async (t: any) => {
        if (t.asignado) {
            await api.delete(`/asignaciones/trabajadores/${t.asignacion_id}`);
        } else {
            await api.post(`/obras/${id}/trabajadores-contratista`, {
                trabajador_contratista_id: t.trabajador_contratista_id,
                unidad_id: Number(unidadContratista),
            });
        }
        await loadAll();
        // refresca la lista disponible manteniendo estado actualizado
        const res = await api.get(`/obras/${id}/contratistas-disponibles`);
        setContratistasDisponibles(res.data);
    };

    const contratistasFiltrados = contratistasDisponibles.reduce((acc: any, row: any) => {
        const key = row.contratista_id;
        if (!acc[key]) {
            acc[key] = {
                contratista_id: key,
                nombre: row.contratista_nombre,
                empresa: row.empresa,
                trabajadores: [],
            };
        }
        acc[key].trabajadores.push(row);
        return acc;
    }, {});

    const gruposParaAsignar = (Object.values(contratistasFiltrados) as any[]).filter((g) => {
        const text = searchCont.toLowerCase();
        return (
            g.nombre?.toLowerCase().includes(text) ||
            g.empresa?.toLowerCase().includes(text) ||
            g.trabajadores.some((t: any) => t.trabajador_nombre?.toLowerCase().includes(text))
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER SIGO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/40">
                            <Construction size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Personal de Obra</h1>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-80 ml-1">
                        Control de Asignaciones y Cuadrillas
                    </p>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Building2 size={16} className="text-red-600" /> Unidades del contrato
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1">Crea las ubicaciones para separar las cuadrillas de esta obra.</p>
                    </div>
                    <div className="flex gap-2">
                        <Input value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} placeholder="NOMBRE DE UNIDAD" className="h-10 w-56 rounded-xl text-[10px] uppercase" />
                        <Button onClick={crearUnidad} disabled={!nuevaUnidad.trim()} size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[9px]">
                            <Plus className="mr-1 h-3 w-3" /> Crear
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {unidades.map((unidad: any) => (
                        <Badge key={unidad.id} className="bg-slate-100 text-slate-700 border-none px-3 py-1.5 text-[9px] uppercase font-black">{unidad.nombre}</Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* SECCIÓN TRABAJADORES INTERNOS */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Users size={16} className="text-red-600" /> Personal Interno
                            </h2>
                        </div>
                        <Button onClick={() => { setFormTrab((prev) => ({ ...prev, unidad_id: String(unidades[0]?.id || "") })); setModalTrab(true); }} size="sm" className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-9 rounded-xl transition-all shadow-lg border-none outline-none ring-0">
                            <Plus className="mr-2 w-3 h-3" strokeWidth={3} /> Asignar
                        </Button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[1.8rem] p-2 shadow-sm flex gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                            <Input
                                placeholder="BUSCAR TRABAJADOR..."
                                value={searchTrab}
                                onChange={(e) => setSearchTrab(e.target.value)}
                                className="pl-10 h-10 border-none bg-slate-50/50 focus:bg-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                        <Select value={filterRol} onValueChange={setFilterRol}>
                            <SelectTrigger className="w-[130px] h-10 border-none bg-slate-50/50 rounded-2xl font-black text-[9px] uppercase tracking-widest outline-none ring-0 focus:ring-0">
                                <SelectValue placeholder="ROL" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 p-1">
                                <SelectItem value="all" className="font-black text-[9px] uppercase py-2 rounded-lg cursor-pointer">Todos</SelectItem>
                                {[...new Set(asigTrab.filter((a:any)=>a.origen==="interno").map((a: any) => a.rol))].filter(Boolean).map(rol => (
                                    <SelectItem key={rol} value={rol} className="font-black text-[9px] uppercase py-2 rounded-lg cursor-pointer">{rol}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-none">
                                    <TableHead className="font-black text-[9px] uppercase pl-8 h-12">Nombre</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase h-12">Rol en Obra</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase h-12">Unidad</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase text-right pr-8 h-12">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trabajadoresPorUnidad.map(({ unidad, trabajadores }: any) => (
                                  <Fragment key={unidad.id}>
                                    <TableRow className="bg-slate-50/70 border-b border-slate-100">
                                        <TableCell colSpan={4} className="px-8 py-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-[10px] uppercase tracking-widest text-slate-700">{unidad.nombre}</span>
                                                <Badge className="bg-slate-200 text-slate-600 border-none font-black text-[9px] uppercase">{trabajadores.length} trabajadores</Badge>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {trabajadores.map((a: any) => (
                                    <TableRow key={a.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-4">
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight text-slate-700">{a.nombre}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase italic">{a.especialidad}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors cursor-default">
                                                {a.rol || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Select value={String(a.unidad_id)} onValueChange={(value) => cambiarUnidadTrabajador(a, value)}>
                                                <SelectTrigger className="h-9 w-36 rounded-xl border-slate-100 bg-slate-50 text-[9px] font-black uppercase">
                                                    <SelectValue placeholder="UNIDAD" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {unidades.map((unidad: any) => <SelectItem key={unidad.id} value={String(unidad.id)}>{unidad.nombre}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right pr-8 py-4">
                                            <Button size="icon" variant="ghost" onClick={() => quitarTrabajador(a.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                  </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                        {trabajadoresPorUnidad.length === 0 && (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center p-10 opacity-40">
                                {searchTrab ? <FilterX size={40} className="mb-4 text-slate-300" /> : <HardHat size={40} className="mb-4 text-slate-300" />}
                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                    {searchTrab ? "Sin coincidencias" : "Sin trabajadores asignados"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN CONTRATISTAS Y SU PERSONAL (agrupado) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Building2 size={16} className="text-red-600" /> Personal de Contratistas
                            </h2>
                        </div>
                        <Button onClick={() => { setUnidadContratista(String(unidades[0]?.id || "")); setModalAsignarContratista(true); }} size="sm" className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-9 rounded-xl transition-all shadow-lg border-none outline-none ring-0">
                            <Plus className="mr-2 w-3 h-3" strokeWidth={3} /> Asignar
                        </Button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm min-h-[400px] p-4 space-y-3">
                        {gruposContratistasPorUnidad.length === 0 && (
                            <div className="h-[350px] flex flex-col items-center justify-center text-center p-10 opacity-40">
                                <Building2 size={40} className="mb-4 text-slate-300" />
                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                    Sin personal de contratistas asignado
                                </p>
                            </div>
                        )}

                        {gruposContratistasPorUnidad.map((g: any) => (
                            <div key={g.unidad.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3 bg-slate-50/70">
                                    <p className="font-black text-xs uppercase tracking-tight text-slate-800 flex items-center gap-2">
                                        <Building2 size={14} className="text-red-600" /> {g.unidad.nombre}
                                    </p>
                                    <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase tracking-widest">
                                        {g.trabajadores.length} personal
                                    </Badge>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {g.trabajadores.map((t: any) => (
                                        <div key={t.id} className="group flex items-center justify-between px-5 py-3 hover:bg-red-50/20 transition-all">
                                            <div className="flex-1">
                                                <p className="font-bold text-[11px] uppercase tracking-tight text-slate-600">{t.nombre}</p>
                                                <p className="text-[9px] uppercase text-slate-400">{t.contratista_nombre}</p>
                                            </div>
                                            <Select value={String(t.unidad_id)} onValueChange={(value) => cambiarUnidadTrabajador(t, value)}>
                                                <SelectTrigger className="h-8 w-36 rounded-xl border-slate-100 bg-white text-[9px] font-black uppercase">
                                                    <SelectValue placeholder="UNIDAD" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {unidades.map((unidad: any) => <SelectItem key={unidad.id} value={String(unidad.id)}>{unidad.nombre}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button size="icon" variant="ghost" onClick={() => quitarTrabajador(t.id)} className="h-7 w-7 rounded-lg hover:bg-red-50 hover:text-red-600 ml-2">
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL TRABAJADOR INTERNO (sin cambios) */}
            <Dialog open={modalTrab} onOpenChange={setModalTrab}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                        <DialogTitle className="font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                            <Users size={20} className="text-red-600" /> Asignar Personal
                        </DialogTitle>
                    </div>
                    <div className="p-8 space-y-5 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Trabajador</Label>
                            <Select value={formTrab.trabajador_id} onValueChange={(v) => setFormTrab({ ...formTrab, trabajador_id: v })}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px] uppercase tracking-wider focus:ring-red-600 transition-all outline-none ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="BUSCAR DISPONIBLES..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl p-2 border-slate-100">
                                    {trabajadores.map((t: any) => (
                                        <SelectItem key={t.id} value={String(t.id)} className="text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg">{t.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidad asignada</Label>
                            <Select value={formTrab.unidad_id} onValueChange={(v) => setFormTrab({ ...formTrab, unidad_id: v })}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px] uppercase tracking-wider focus:ring-red-600">
                                    <SelectValue placeholder="SELECCIONAR UNIDAD" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unidades.map((unidad: any) => <SelectItem key={unidad.id} value={String(unidad.id)}>{unidad.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha de Alta</Label>
                                <Input type="date" className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-bold text-[11px] uppercase outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => setFormTrab({ ...formTrab, fecha_inicio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rol / Puesto</Label>
                                <Input placeholder="EJ. RESIDENTE" className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-bold text-[11px] uppercase outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => setFormTrab({ ...formTrab, rol: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50 gap-3">
                        <Button variant="ghost" onClick={() => setModalTrab(false)} className="font-black text-[10px] uppercase text-slate-400">Cancelar</Button>
                        <Button disabled={!formTrab.trabajador_id || !formTrab.unidad_id} onClick={asignarTrabajador} className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black px-8 rounded-xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 transition-all border-none ring-0">Confirmar Asignación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL NUEVO: DESPLEGAR CONTRATISTAS -> ELEGIR TRABAJADORES */}
            <Dialog open={modalAsignarContratista} onOpenChange={setModalAsignarContratista}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                        <DialogTitle className="font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                            <Building2 size={20} className="text-red-600" /> Asignar Personal de Contratista
                        </DialogTitle>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">
                            Despliega un contratista y marca a su personal
                        </p>
                    </div>

                    <div className="p-6 space-y-4 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidad para el personal seleccionado</Label>
                            <Select value={unidadContratista} onValueChange={setUnidadContratista}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-black uppercase"><SelectValue placeholder="SELECCIONAR UNIDAD" /></SelectTrigger>
                                <SelectContent>
                                    {unidades.map((unidad: any) => <SelectItem key={unidad.id} value={String(unidad.id)}>{unidad.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                            <Input
                                placeholder="BUSCAR CONTRATISTA O TRABAJADOR..."
                                value={searchCont}
                                onChange={(e) => setSearchCont(e.target.value)}
                                className="pl-10 h-10 border-slate-100 bg-slate-50/50 rounded-2xl text-[9px] font-black uppercase tracking-widest outline-none focus-visible:ring-0"
                            />
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {gruposParaAsignar.length === 0 && (
                                <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 py-10">
                                    Sin contratistas disponibles
                                </p>
                            )}

                            {gruposParaAsignar.map((g: any) => {
                                const asignadosCount = g.trabajadores.filter((t: any) => t.asignado).length;
                                const isOpen = expandido === g.contratista_id;

                                return (
                                    <div key={g.contratista_id} className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandido(isOpen ? null : g.contratista_id)}
                                            className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/70 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-red-600" />
                                                <span className="font-black text-xs uppercase tracking-tight text-slate-800">
                                                    {g.nombre}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {asignadosCount > 0 && (
                                                    <Badge className="bg-red-600 text-white border-none font-black text-[9px] uppercase">
                                                        {asignadosCount}
                                                    </Badge>
                                                )}
                                                <ChevronDown
                                                    size={14}
                                                    className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                />
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="divide-y divide-slate-50">
                                                {g.trabajadores.map((t: any) => (
                                                    <label
                                                        key={t.trabajador_contratista_id}
                                                        className="flex items-center justify-between px-5 py-3 hover:bg-red-50/20 cursor-pointer transition-colors"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-[11px] uppercase tracking-tight text-slate-700">
                                                                {t.trabajador_nombre}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                {t.puesto || "Sin puesto"}
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={t.asignado}
                                                            onChange={() => toggleTrabajadorContratista(t)}
                                                            disabled={!t.asignado && !unidadContratista}
                                                            className="w-4 h-4 accent-red-600 cursor-pointer"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50">
                        <Button
                            variant="ghost"
                            onClick={() => setModalAsignarContratista(false)}
                            className="font-black text-[10px] uppercase text-slate-400"
                        >
                            Listo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
