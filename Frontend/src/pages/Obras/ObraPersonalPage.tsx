import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import {
    Plus, Trash2, Users, Building2,
    HardHat, Construction, Search,
    FilterX
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
    const [contratistas, setContratistas] = useState([]);
    const [asigTrab, setAsigTrab] = useState([]);
    const [asigCont, setAsigCont] = useState([]);

    // Estados para búsqueda y filtros
    const [searchTrab, setSearchTrab] = useState("");
    const [searchCont, setSearchCont] = useState("");
    const [filterRol, setFilterRol] = useState("all");

    const [modalTrab, setModalTrab] = useState(false);
    const [modalCont, setModalCont] = useState(false);

    const [formTrab, setFormTrab] = useState({
        trabajador_id: "",
        fecha_inicio: "",
        rol: ""
    });

    const [formCont, setFormCont] = useState({
        contratista_id: "",
        fecha_inicio: "",
        servicio: ""
    });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [t1, t2, t3, t4] = await Promise.all([
                api.get("/trabajadores/disponibles"),
                api.get("/contratistas"),
                api.get(`/obras/${id}/trabajadores`),
                api.get(`/obras/${id}/contratistas`)
            ]);
            setTrabajadores(t1.data);
            setContratistas(t2.data);
            setAsigTrab(t3.data);
            setAsigCont(t4.data);
        } catch (err) {
            console.error("Error cargando personal:", err);
        }
    };

    // Lógica de filtrado
    const filteredTrab = asigTrab.filter((a: any) => {
        const matchesSearch = a.nombre.toLowerCase().includes(searchTrab.toLowerCase());
        const matchesRol = filterRol === "all" || a.rol === filterRol;
        return matchesSearch && matchesRol;
    });

    const filteredCont = asigCont.filter((a: any) => {
        return a.nombre.toLowerCase().includes(searchCont.toLowerCase()) ||
            a.servicio?.toLowerCase().includes(searchCont.toLowerCase());
    });

    const asignarTrabajador = async () => {
        await api.post(`/obras/${id}/trabajadores`, {
            ...formTrab,
            trabajador_id: Number(formTrab.trabajador_id)
        });
        setModalTrab(false);
        loadAll();
    };

    const asignarContratista = async () => {
        await api.post(`/obras/${id}/contratistas`, {
            ...formCont,
            contratista_id: Number(formCont.contratista_id)
        });
        setModalCont(false);
        loadAll();
    };

    const quitarTrabajador = async (asigId: number) => {
        if (!confirm("¿Retirar trabajador de esta obra?")) return;
        await api.delete(`/asignaciones/trabajadores/${asigId}`);
        loadAll();
    };

    const quitarContratista = async (asigId: number) => {
        if (!confirm("¿Retirar contratista de esta obra?")) return;
        await api.delete(`/asignaciones/contratistas/${asigId}`);
        loadAll();
    };

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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* SECCIÓN TRABAJADORES */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Users size={16} className="text-red-600" /> Personal Interno
                            </h2>
                        </div>
                        <Button onClick={() => setModalTrab(true)} size="sm" className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-9 rounded-xl transition-all shadow-lg border-none outline-none ring-0">
                            <Plus className="mr-2 w-3 h-3" strokeWidth={3} /> Asignar
                        </Button>
                    </div>

                    {/* TOOLBAR TRABAJADORES */}
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
                                {[...new Set(asigTrab.map((a: any) => a.rol))].filter(Boolean).map(rol => (
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
                                    <TableHead className="font-black text-[9px] uppercase text-right pr-8 h-12">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTrab.map((a: any) => (
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
                                        <TableCell className="text-right pr-8 py-4">
                                            <Button size="icon" variant="ghost" onClick={() => quitarTrabajador(a.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredTrab.length === 0 && (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center p-10 opacity-40">
                                {searchTrab ? <FilterX size={40} className="mb-4 text-slate-300" /> : <HardHat size={40} className="mb-4 text-slate-300" />}
                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                    {searchTrab ? "Sin coincidencias" : "Sin trabajadores asignados"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN CONTRATISTAS */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Building2 size={16} className="text-red-600" /> Contratistas
                            </h2>
                        </div>
                        <Button onClick={() => setModalCont(true)} size="sm" className="bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[9px] tracking-widest h-9 rounded-xl transition-all shadow-lg border-none outline-none ring-0">
                            <Plus className="mr-2 w-3 h-3" strokeWidth={3} /> Asignar
                        </Button>
                    </div>

                    {/* TOOLBAR CONTRATISTAS */}
                    <div className="bg-white border border-slate-100 rounded-[1.8rem] p-2 shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                            <Input
                                placeholder="BUSCAR EMPRESA O SERVICIO..."
                                value={searchCont}
                                onChange={(e) => setSearchCont(e.target.value)}
                                className="pl-10 h-10 border-none bg-slate-50/50 focus:bg-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-none">
                                    <TableHead className="font-black text-[9px] uppercase pl-8 h-12">Empresa</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase h-12">Servicio</TableHead>
                                    <TableHead className="font-black text-[9px] uppercase text-right pr-8 h-12">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCont.map((a: any) => (
                                    <TableRow key={a.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-4">
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight text-slate-700">{a.nombre}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase italic">Ref: Proveedor</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors cursor-default">
                                                {a.servicio || "Subcontrato"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8 py-4">
                                            <Button size="icon" variant="ghost" onClick={() => quitarContratista(a.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredCont.length === 0 && (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center p-10 opacity-40">
                                {searchCont ? <FilterX size={40} className="mb-4 text-slate-300" /> : <Building2 size={40} className="mb-4 text-slate-300" />}
                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                    {searchCont ? "Sin coincidencias" : "Sin contratistas asignados"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL TRABAJADOR */}
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
                        <Button onClick={asignarTrabajador} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 rounded-xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 transition-all border-none ring-0">Confirmar Asignación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL CONTRATISTA */}
            <Dialog open={modalCont} onOpenChange={setModalCont}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                        <DialogTitle className="font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                            <Building2 size={20} className="text-red-600" /> Asignar Contratista
                        </DialogTitle>
                    </div>
                    <div className="p-8 space-y-5 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Empresa</Label>
                            <Select value={formCont.contratista_id} onValueChange={(v) => setFormCont({ ...formCont, contratista_id: v })}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px] uppercase tracking-wider outline-none ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="BUSCAR PROVEEDOR..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl p-2 border-slate-100">
                                    {contratistas.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)} className="text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg">{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha Inicio</Label>
                                <Input type="date" className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px] uppercase outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => setFormCont({ ...formCont, fecha_inicio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Servicio / Concepto</Label>
                                <Input placeholder="EJ. EXCAVACIÓN" className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px] uppercase outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => setFormCont({ ...formCont, servicio: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50 gap-3">
                        <Button variant="ghost" onClick={() => setModalCont(false)} className="font-black text-[10px] uppercase text-slate-400">Cancelar</Button>
                        <Button onClick={asignarContratista} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 rounded-xl uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-red-100 transition-all border-none ring-0">Confirmar Asignación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}