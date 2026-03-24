import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "User Management",
  "/roles": "Roles & Permissions",
  "/audit-logs": "Audit Logs",
};

interface TopNavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function TopNavbar({ darkMode, onToggleDark }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || "NexusAdmin";

  const notifications = [
    { id: 1, text: "New user registration: sarah@acme.com", time: "2m ago", unread: true },
    { id: 2, text: "Role 'Editor' permissions updated by Admin", time: "18m ago", unread: true },
    { id: 3, text: "Failed login attempt detected from IP 192.168.1.x", time: "1h ago", unread: false },
  ];

  return (
    <header className="h-14 bg-card/80 backdrop-blur border-b border-border flex items-center gap-3 px-4 sticky top-0 z-40">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" />

      <div className="flex-1 flex items-center gap-3">
        <h1 className="font-semibold text-foreground text-sm">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search */}
        {showSearch ? (
          <div className="flex items-center">
            <Input
              autoFocus
              placeholder="Search users, logs..."
              className="h-8 w-56 text-sm"
              onBlur={() => setShowSearch(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggleDark}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] text-destructive-foreground flex items-center justify-center font-bold">
                2
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-xs h-5">2 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  <div className={`flex-1 ${!n.unread ? "ml-3.5" : ""}`}>
                    <p className={`text-xs leading-relaxed ${n.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {n.text}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{n.time}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-center justify-center text-primary font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
              <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">SA</span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">Super Admin</span>
              <div className="flex items-center gap-1 hidden sm:flex">
                <Shield className="w-3 h-3 text-primary" />
              </div>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Super Admin</span>
                <span className="text-xs text-muted-foreground font-normal">admin@company.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-md px-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Session active · 2h 14m
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
              <User className="w-4 h-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
              <Settings className="w-4 h-4" /> Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer"
              onClick={() => navigate("/login")}
            >
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
