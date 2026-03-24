import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation } from "react-router-dom";
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

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Roles & Permissions", url: "/roles", icon: Shield },
  { title: "Audit Logs", url: "/audit-logs", icon: FileText },
];

const systemNav = [
  { title: "Analytics", url: "/analytics", icon: BarChart3, disabled: true },
  { title: "Notifications", url: "/notifications", icon: Bell, disabled: true },
  { title: "Modules", url: "/modules", icon: Package, disabled: true },
  { title: "Settings", url: "/settings", icon: Settings, disabled: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sidebar-foreground tracking-tight text-sm">NexusAdmin</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">
              Core
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 font-medium ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">
              Platform
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <div
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        item.disabled
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center gap-2 flex-1">
                          <span>{item.title}</span>
                          {item.disabled && (
                            <span className="ml-auto text-[10px] font-semibold bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <SidebarSeparator className="mb-3" />
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-foreground">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">Super Admin</p>
              <p className="text-[11px] text-muted-foreground truncate">admin@company.com</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" title="Session active" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">SA</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
