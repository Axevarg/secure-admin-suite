import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LOGS = [
  { id: 1, user: "admin@company.com", action: "USER_CREATE", module: "Users", date: "2025-03-24 09:14:22", ip: "10.0.1.42", details: "Created user account for sarah.chen@acme.com with role Editor", severity: "info" },
  { id: 2, user: "sarah.chen@acme.com", action: "ROLE_UPDATE", module: "Roles", date: "2025-03-24 09:02:11", ip: "10.0.2.18", details: "Updated Editor role: added 'Reports.create' permission", severity: "warning" },
  { id: 3, user: "unknown", action: "AUTH_FAIL", module: "Auth", date: "2025-03-24 08:55:33", ip: "192.168.1.101", details: "5 consecutive failed login attempts for james.k@acme.com — account temporarily locked", severity: "critical" },
  { id: 4, user: "lisa.m@acme.com", action: "AUDIT_EXPORT", module: "Audit", date: "2025-03-24 08:30:00", ip: "10.0.3.7", details: "Exported audit logs for date range 2025-03-01 to 2025-03-24", severity: "info" },
  { id: 5, user: "admin@company.com", action: "USER_DELETE", module: "Users", date: "2025-03-23 17:22:05", ip: "10.0.1.42", details: "Deleted inactive user account: old.user@company.com (last active: 2025-01-05)", severity: "warning" },
  { id: 6, user: "james.k@acme.com", action: "LOGIN_SUCCESS", module: "Auth", date: "2025-03-23 16:44:12", ip: "10.0.2.18", details: "Successful login from Chrome/Windows. Session ID: ses_8x2pq", severity: "info" },
  { id: 7, user: "admin@company.com", action: "SETTINGS_UPDATE", module: "Settings", date: "2025-03-23 15:10:08", ip: "10.0.1.42", details: "Changed session timeout policy from 4h to 8h", severity: "warning" },
  { id: 8, user: "priya.n@acme.com", action: "REPORT_EXPORT", module: "Reports", date: "2025-03-23 14:05:55", ip: "10.0.4.22", details: "Exported monthly user activity report (CSV, 2,847 rows)", severity: "info" },
  { id: 9, user: "system", action: "BACKUP_COMPLETE", module: "System", date: "2025-03-23 03:00:00", ip: "internal", details: "Automated database backup completed successfully. Size: 2.4 GB", severity: "info" },
  { id: 10, user: "alex.j@acme.com", action: "ACCOUNT_SUSPEND", module: "Users", date: "2025-03-22 11:30:45", ip: "10.0.1.42", details: "Account suspended due to policy violation. Suspended by: admin@company.com", severity: "critical" },
];

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-primary-muted text-primary border-primary/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const ACTION_COLORS: Record<string, string> = {
  USER_CREATE: "text-success",
  USER_DELETE: "text-destructive",
  ROLE_UPDATE: "text-warning",
  AUTH_FAIL: "text-destructive",
  LOGIN_SUCCESS: "text-success",
  AUDIT_EXPORT: "text-primary",
  SETTINGS_UPDATE: "text-warning",
  REPORT_EXPORT: "text-primary",
  BACKUP_COMPLETE: "text-success",
  ACCOUNT_SUSPEND: "text-destructive",
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<typeof LOGS[0] | null>(null);

  const filtered = LOGS.filter((log) => {
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || log.module === moduleFilter;
    const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchSearch && matchModule && matchSeverity;
  });

  const modules = [...new Set(LOGS.map((l) => l.module))];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Audit Logs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {LOGS.length} events recorded · Last 30 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 text-sm font-medium">
            <Calendar className="w-4 h-4" /> Date Range
          </Button>
          <Button variant="outline" className="gap-2 h-9 text-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: "1,204", sub: "last 30 days", color: "text-primary" },
          { label: "Warnings", value: "28", sub: "require review", color: "text-warning" },
          { label: "Critical", value: "3", sub: "needs attention", color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-xs font-semibold text-foreground">{s.label}</div>
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or details..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-9 text-sm w-32">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 text-sm w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["User", "Action", "Module", "Date", "Severity", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 first:px-5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-primary-foreground">
                          {log.user === "system" ? "SY" : log.user === "unknown" ? "??" : log.user.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-mono font-semibold ${ACTION_COLORS[log.action] || "text-foreground"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div>
                      <div className="text-xs font-medium text-foreground">{log.date.split(" ")[0]}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{log.date.split(" ")[1]}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-2 font-semibold capitalize ${SEVERITY_STYLES[log.severity]}`}
                    >
                      {log.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Filter className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No logs match your filters</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {LOGS.length} events
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
            Live · updates every 30s
          </div>
        </div>
      </div>

      {/* Log detail modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className={`font-mono font-bold ${ACTION_COLORS[selectedLog?.action || ""] || "text-foreground"}`}>
                {selectedLog?.action}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] h-5 px-2 font-semibold capitalize ${SEVERITY_STYLES[selectedLog?.severity || "info"]}`}
              >
                {selectedLog?.severity}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "User", value: selectedLog.user },
                  { label: "Module", value: selectedLog.module },
                  { label: "Date & Time", value: selectedLog.date },
                  { label: "IP Address", value: selectedLog.ip },
                ].map((f) => (
                  <div key={f.label} className="bg-muted/40 rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</div>
                    <div className="text-xs font-medium text-foreground font-mono">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Event Details</div>
                <p className="text-sm text-foreground leading-relaxed">{selectedLog.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
