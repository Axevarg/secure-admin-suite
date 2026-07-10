import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Truck,
  HardHat,
  Construction,
  Tags,
  UserCog,
  KeyRound,
  FileText,
  Settings,
  ClipboardList,
  Users,
  Clock,
  DollarSign,
  Package,
  TruckIcon,
  CreditCard,
  Camera,
  ArrowLeft,
  Landmark,
  ChevronDown, ClipboardCheck, Banknote, ShieldCheck, Wallet, ArrowRightLeft,
  Coins
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

/* =========================
   NAV GLOBAL
========================= */

const mainNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    perm: "dashboard:view",
  },
  { title: "Obras", url: "/obras", icon: Building2, perm: "obras:view" },
];

const systemNav = [
  {
    title: "Clientes",
    url: "/clientes",
    icon: Briefcase,
    perm: "clientes:view",
  },
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Truck,
    perm: "proveedores:view",
  },
  {
    title: "Trabajadores",
    url: "/trabajadores",
    icon: HardHat,
    perm: "trabajadores:view",
  },
  {
    title: "Contratistas",
    url: "/contratistas",
    icon: Construction,
    perm: "contratistas:view",
  },
  {
    title: "Especialidades",
    url: "/especialidades",
    icon: Tags,
    perm: "especialidades:view",
  },
  {
    title: "Aprobaciones",
    url: "/aprobaciones",
    icon: ClipboardCheck,
    perm: "aprobaciones:view",
  },
  {
    title: "Remesas",
    url: "/remesas",
    icon: Banknote,
    perm: "remesas:view",
  },

  /* ── BANCOS ───────────────────── */
  {
    title: "Bancos",
    icon: Landmark,
    perm: "remesas:view",
    children: [
      {
        title: "Dashboard",
        url: "/bancos",
        icon: LayoutDashboard,
        perm: "remesas:view",
      },
      {
        title: "Cuentas",
        url: "/bancos/cuentas",
        icon: CreditCard,
        perm: "remesas:view",
      },
      {
        title: "Movimientos",
        url: "/bancos/movimientos",
        icon: ArrowRightLeft,
        perm: "remesas:view",
      },
    ],
  },

  /* ── NÓMINAS / RH ─────────────── */
  {
    title: "Nóminas",
    icon: Wallet,
    perm: "rh:view",
    children: [
      {
        title: "Colaboradores",
        url: "/colaboradores",
        icon: Users,
        perm: "rh:view",
      },
      {
        title: "Nomina",
        url: "/nomina",
        icon: Coins,
        perm: "rh:approve",
      },
    ],
  },

  {
    title: "Usuarios",
    url: "/usuarios",
    icon: UserCog,
    perm: "usuarios:view",
  },
  {
    title: "Roles",
    url: "/roles",
    icon: ShieldCheck,
    perm: "usuarios:view",
  },
];


/* =========================
   NAV OBRA (WORKSPACE)
========================= */

const obraNav = (id: string) => [
  {
    title: "Dashboard Obra",
    url: `/obras/${id}/dashboard`,
    icon: LayoutDashboard,
    perm: "obra_dashboard:view",
  },
  {
    title: "Personal en Obra",
    url: `/obras/${id}/personal`,
    icon: Users,
    perm: "trabajadores:view",
  },
  {
    title: "Asistencia",
    url: `/obras/${id}/asistencia`,
    icon: Clock,
    perm: "asistencia:view",
  },
  {
    title: "Insumos",
    url: `/obras/${id}/insumos`,
    icon: Package,
    perm: "presupuesto:view",
  },
  {
    title: "Requisiciones",
    url: `/obras/${id}/requisiciones`,
    icon: ClipboardList,
    perm: "requisiciones:view",
  },
  {
    title: "Evidencias",
    url: `/obras/${id}/evidencias`,
    icon: Camera,
    perm: "evidencias:view",
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const params = useParams();

  const obraId = params.id;

  const isObraView = location.pathname.startsWith("/obras/") && !!obraId;

  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Bancos: location.pathname.startsWith("/bancos"),
    Nominas: location.pathname.startsWith("/colaboradores"),
  });

  useEffect(() => {
    const storage = localStorage.getItem("user")
      ? localStorage
      : sessionStorage;

    const storedUser = storage.getItem("user");
    const storedPermissions = storage.getItem("permissions");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedPermissions) setPermissions(JSON.parse(storedPermissions));
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "AV";

  const role = user?.role_name || "usuario";

  const hasPermission = (perm?: string) => {
    if (!perm) return true;
    return permissions.includes(perm);
  };

  const nav = isObraView ? obraNav(obraId!) : mainNav;

  const filteredNav = nav.filter((item) => hasPermission(item.perm));
  const filteredSystemNav = systemNav.filter((item) =>
    hasPermission(item.perm),
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      {/* HEADER */}
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg">
            <HardHat className="w-5 h-5 text-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-xl leading-none">
                SIGO
              </span>

              <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">
                {isObraView ? "Obra Activa" : "Iliasa"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-slate-100" />

      {/* NAV */}
      <SidebarContent className="px-3 pt-4">
        {/* BOTÓN VOLVER SI ESTÁ EN OBRA */}
        {isObraView && (
          <div className="mb-3">
            <NavLink
              to="/obras"
              className="flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700"
            >
              <ArrowLeft size={16} />
              {!collapsed && "Volver a Obras"}
            </NavLink>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black text-slate-400 uppercase px-2 mb-2">
            {isObraView ? "Gestión de Obra" : "Gestión Operativa"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition ${
                          isActive
                            ? "bg-red-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-red-50 hover:text-red-700"
                        }`}
                      >
                        <item.icon className="w-4.5 h-4.5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isObraView && (
          <>
            <SidebarSeparator className="my-4 bg-slate-50" />

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-black text-slate-400 uppercase px-2 mb-2">
                Sistema
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {filteredSystemNav.map((item: any) => {
                    const hasChildren = item.children;

                    if (hasChildren) {
                      const isChildActive = item.children.some(
                        (c: any) => location.pathname === c.url,
                      );

                      return (
                        <div key={item.title} className="space-y-1">
                          {/* PADRE */}
                          <button
                            onClick={() =>
                              setOpenMenus((prev) => ({
                                ...prev,
                                [item.title]: !prev[item.title],
                              }))
                            }
                            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-sm font-bold transition ${
                              isChildActive
                                ? "bg-red-600 text-white shadow-md"
                                : "text-slate-600 hover:bg-red-50 hover:text-red-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </div>

                            {!collapsed && (
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${
                                  openMenus[item.title] ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </button>

                          {/* HIJOS */}
                          {openMenus[item.title] && !collapsed && (
                            <div className="ml-4 pl-3 border-l border-slate-200 space-y-1">
                              {item.children
                                .filter((child: any) =>
                                  hasPermission(child.perm),
                                )
                                .map((child: any) => {
                                  const isActive =
                                    location.pathname === child.url;

                                  return (
                                    <NavLink
                                      key={child.title}
                                      to={child.url}
                                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition ${
                                        isActive
                                          ? "bg-red-50 text-red-700"
                                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <child.icon className="w-4 h-4" />
                                      <span>{child.title}</span>
                                    </NavLink>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = location.pathname === item.url;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition ${
                              isActive
                                ? "bg-red-600 text-white shadow-md"
                                : "text-slate-600 hover:bg-red-50 hover:text-red-700"
                            }`}
                          >
                            <item.icon className="w-4.5 h-4.5" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="px-4 py-6 border-t border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center text-white text-[10px] font-black">
            {initials}
          </div>

          {!collapsed && (
            <div>
              <p className="text-xs font-black">{user?.name || "Usuario"}</p>
              <p className="text-[10px] text-red-600 uppercase">{role}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
