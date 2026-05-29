import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/axios";

import {
  Bell, ChevronDown, LogOut, Search,
  Settings, User, Building2, Construction
} from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Panel de Control",
  "/obras": "Gestión de Obras",
  "/clientes": "Cartera de Clientes",
  "/reportes": "Centro de Inteligencia",
  "/settings": "Configuración del Sistema",
};

interface TopNavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function TopNavbar({ darkMode, onToggleDark }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [obras, setObras] = useState<any[]>([]);
  const [activeObra, setActiveObra] = useState<any>(null);

  const pageTitle = PAGE_TITLES[location.pathname] || "GESTIÓN DE OBRA";
  const isObraMode = location.pathname.startsWith("/obras/") && location.pathname !== "/obras";
  const obraIdFromUrl = location.pathname.match(/\/obras\/(\d+)/)?.[1];

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    loadObras();
    const saved = localStorage.getItem("activeObra");
    if (saved) setActiveObra(JSON.parse(saved));
  }, []);

  const loadObras = async () => {
    try {
      const res = await api.get("/obras");
      setObras(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!obraIdFromUrl || obras.length === 0) return;
    const found = obras.find((o) => String(o.id) === obraIdFromUrl);
    if (found) {
      setActiveObra(found);
      localStorage.setItem("activeObra", JSON.stringify(found));
    }
  }, [obraIdFromUrl, obras]);

  const selectObra = (obra: any) => {
    setActiveObra(obra);
    localStorage.setItem("activeObra", JSON.stringify(obra));
    navigate(`/obras/${obra.id}/dashboard`);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.log(err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  };

  const notifications = [
    { id: 1, text: "Nueva solicitud de material", time: "2m", unread: true },
    { id: 2, text: "Reporte semanal generado", time: "15m", unread: false },
  ];

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-100 flex items-center gap-4 px-6 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="hover:bg-slate-100 rounded-xl" />
        <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden sm:block" />
      </div>

      <div className="flex-1 flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">PROYECTO SIGO</h1>
          <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 leading-none">{pageTitle}</h2>
        </div>

        {isObraMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-3 px-4 border-slate-200 bg-white hover:bg-slate-50 rounded-2xl shadow-sm transition-all border-none outline-none ring-0 focus-visible:ring-0">
                <div className="bg-red-600 p-1.5 rounded-lg shadow-md shadow-red-100">
                  <Construction className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                  {activeObra?.nombre || "Seleccionar Obra"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72 p-2 rounded-[1.8rem] border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 px-4 py-3">Proyectos en curso</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              <div className="max-h-[300px] overflow-y-auto p-1">
                {obras.map((o) => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => selectObra(o)}
                    className="cursor-pointer flex items-center gap-3 p-3 rounded-xl mb-1 focus:bg-red-50 focus:text-red-600 transition-all group"
                  >
                    <div className={`p-2 rounded-lg transition-colors ${String(o.id) === obraIdFromUrl ? "bg-red-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-red-100"}`}>
                      <Building2 size={14} strokeWidth={2.5} />
                    </div>
                    <span className={`text-[10px] uppercase tracking-tight ${String(o.id) === obraIdFromUrl ? "font-black" : "font-bold text-slate-600"}`}>
                      {o.nombre}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ACCIONES DERECHA */}
      <div className="flex items-center gap-2">
        {showSearch ? (
          <div className="relative animate-in slide-in-from-right-4 duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-600" />
            <Input 
              autoFocus 
              placeholder="BUSCAR EN SIGO..." 
              className="w-64 h-10 pl-9 rounded-2xl bg-slate-50 border-none font-black text-[9px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-red-100 transition-all"
              onBlur={() => setShowSearch(false)} 
            />
          </div>
        ) : (
          <Button className="rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-red-600 h-10 w-10 transition-all"
            variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}

        {/* NOTIFICATIONS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-red-600 relative transition-all outline-none ring-0 focus-visible:ring-0">
              <Bell className="w-4 h-4" strokeWidth={2.5} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white ring-2 ring-red-100" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-[2rem] border-slate-100 shadow-2xl">
            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-slate-900 p-4">Notificaciones Recientes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-1">
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="p-4 rounded-2xl flex flex-col items-start gap-1 mb-1 focus:bg-slate-50 cursor-pointer">
                  <p className={`text-[11px] uppercase tracking-tight ${n.unread ? "font-black text-slate-900" : "font-bold text-slate-500"}`}>{n.text}</p>
                  <p className="text-[9px] font-black text-red-600/50 uppercase italic">{n.time} atrás</p>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-[1px] bg-slate-100 mx-1" />

        {/* USER PROFILE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-12 gap-3 hover:bg-slate-50 rounded-2xl px-2 transition-all outline-none ring-0 focus-visible:ring-0">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                {user?.name?.slice(0, 2).toUpperCase() || "GA"}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase">{user?.name}</span>
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest opacity-70">{user?.role_name || "Sistemas"}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-300 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-2 rounded-[2rem] border-slate-100 shadow-2xl overflow-hidden">
            <div className="px-4 py-4 bg-slate-50 rounded-[1.5rem] mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Sesión Activa</p>
              <p className="text-[11px] font-black text-slate-900 truncate uppercase">{user?.email}</p>
            </div>
            <DropdownMenuItem className="font-black uppercase text-[10px] tracking-widest focus:bg-red-50 focus:text-red-600 transition-colors rounded-xl py-3 px-4 mb-1 cursor-pointer">
              <User className="w-4 h-4 mr-3 opacity-50" /> Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="font-black uppercase text-[10px] tracking-widest focus:bg-red-50 focus:text-red-600 transition-colors rounded-xl py-3 px-4 mb-1 cursor-pointer">
              <Settings className="w-4 h-4 mr-3 opacity-50" /> Preferencias
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem onClick={handleLogout}
              className="font-black uppercase text-[10px] tracking-widest focus:bg-red-600 focus:text-white transition-all rounded-xl py-3 px-4 cursor-pointer text-red-600 mt-1">
              <LogOut className="w-4 h-4 mr-3" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}