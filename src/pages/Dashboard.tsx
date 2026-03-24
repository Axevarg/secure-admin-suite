import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    label: "Total Users",
    value: "2,847",
    change: "+12.4%",
    trend: "up",
    icon: Users,
    color: "primary",
  },
  {
    label: "Active Sessions",
    value: "143",
    change: "+5 now",
    trend: "up",
    icon: Activity,
    color: "success",
  },
  {
    label: "Security Events",
    value: "7",
    change: "-3 this week",
    trend: "down",
    icon: Shield,
    color: "warning",
  },
  {
    label: "Audit Actions",
    value: "1,204",
    change: "+8.1% today",
    trend: "up",
    icon: FileText,
    color: "primary",
  },
];

const recentActions = [
  { user: "sarah.chen@acme.com", action: "Updated role permissions", module: "Roles", time: "2m ago", type: "update" },
  { user: "admin@company.com", action: "Created user account", module: "Users", time: "14m ago", type: "create" },
  { user: "james.k@acme.com", action: "Failed login attempt", module: "Auth", time: "31m ago", type: "warning" },
  { user: "lisa.m@acme.com", action: "Exported audit logs", module: "Audit", time: "1h ago", type: "info" },
  { user: "admin@company.com", action: "Deleted inactive user", module: "Users", time: "2h ago", type: "delete" },
];

const systemStatus = [
  { name: "Authentication Service", status: "operational", latency: "12ms" },
  { name: "Database Cluster", status: "operational", latency: "4ms" },
  { name: "Permission Engine", status: "operational", latency: "8ms" },
  { name: "Audit Logger", status: "degraded", latency: "142ms" },
];

const actionColors = {
  create: "bg-success-muted text-success",
  update: "bg-primary-muted text-primary",
  delete: "bg-destructive/10 text-destructive",
  warning: "bg-warning-muted text-warning",
  info: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Welcome banner */}
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-10">
          <Shield className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 animate-pulse" />
            <span className="text-primary-foreground/70 text-xs font-medium">Monday, 24 March 2025</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Good morning, Admin 👋</h2>
          <p className="text-primary-foreground/70 text-sm">
            7 security events need your attention. 143 users currently active.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  stat.color === "primary" ? "bg-primary-muted" :
                  stat.color === "success" ? "bg-success-muted" :
                  "bg-warning-muted"
                }`}>
                  <Icon className={`w-4.5 h-4.5 ${
                    stat.color === "primary" ? "text-primary" :
                    stat.color === "success" ? "text-success" :
                    "text-warning"
                  }`} style={{ width: "18px", height: "18px" }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === "up" && stat.color !== "warning" ? "text-success" :
                  stat.trend === "down" || stat.color === "warning" ? "text-muted-foreground" :
                  "text-success"
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Actions */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 24 hours across all modules</p>
            </div>
            <a href="/audit-logs" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-border">
            {recentActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  action.type === "create" ? "bg-success" :
                  action.type === "update" ? "bg-primary" :
                  action.type === "delete" ? "bg-destructive" :
                  action.type === "warning" ? "bg-warning" :
                  "bg-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{action.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${actionColors[action.type as keyof typeof actionColors]}`}>
                      {action.module}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{action.user}</span>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {action.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">System Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time service health</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
                <span className="text-xs text-success font-medium">3/4 Healthy</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {systemStatus.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  {svc.status === "operational" ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground">{svc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono">{svc.latency}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 font-semibold ${
                      svc.status === "operational"
                        ? "border-success/30 text-success bg-success-muted"
                        : "border-warning/30 text-warning bg-warning-muted"
                    }`}
                  >
                    {svc.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Last checked 30 seconds ago
            </div>
          </div>
        </div>
      </div>

      {/* User activity summary */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-sm">User Activity Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Logins by role type this week</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { role: "Super Admin", count: 12, total: 12, color: "bg-primary" },
            { role: "Administrators", count: 38, total: 50, color: "bg-primary/70" },
            { role: "Editors", count: 156, total: 300, color: "bg-success" },
            { role: "Viewers", count: 890, total: 2485, color: "bg-muted-foreground" },
          ].map((item) => {
            const pct = Math.round((item.count / item.total) * 100);
            return (
              <div key={item.role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{item.role}</span>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.count} active</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
