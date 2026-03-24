import { useState } from "react";
import { ChevronDown, Edit2, Info, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = [
  {
    id: 1,
    name: "Super Admin",
    description: "Unrestricted access to all system features",
    userCount: 2,
    color: "bg-primary text-primary-foreground",
    system: true,
  },
  {
    id: 2,
    name: "Administrator",
    description: "Full access except system configuration",
    userCount: 8,
    color: "bg-primary/15 text-primary",
    system: false,
  },
  {
    id: 3,
    name: "Editor",
    description: "Can create and edit content, limited admin access",
    userCount: 34,
    color: "bg-success-muted text-success",
    system: false,
  },
  {
    id: 4,
    name: "Viewer",
    description: "Read-only access to allowed modules",
    userCount: 156,
    color: "bg-muted text-muted-foreground",
    system: false,
  },
];

const MODULES = ["Users", "Roles", "Audit Logs", "Reports", "Settings", "Billing"];

const PERMISSIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
];

// Permission matrix: role -> module -> permission[] 
const DEFAULT_MATRIX: Record<string, Record<string, string[]>> = {
  "Super Admin": {
    "Users": ["view", "create", "edit", "delete", "export"],
    "Roles": ["view", "create", "edit", "delete", "export"],
    "Audit Logs": ["view", "export"],
    "Reports": ["view", "create", "export"],
    "Settings": ["view", "edit"],
    "Billing": ["view", "edit"],
  },
  "Administrator": {
    "Users": ["view", "create", "edit", "delete"],
    "Roles": ["view", "edit"],
    "Audit Logs": ["view", "export"],
    "Reports": ["view", "create", "export"],
    "Settings": ["view"],
    "Billing": ["view"],
  },
  "Editor": {
    "Users": ["view"],
    "Roles": ["view"],
    "Audit Logs": ["view"],
    "Reports": ["view", "create"],
    "Settings": [],
    "Billing": [],
  },
  "Viewer": {
    "Users": ["view"],
    "Roles": ["view"],
    "Audit Logs": [],
    "Reports": ["view"],
    "Settings": [],
    "Billing": [],
  },
};

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState(ROLES[1]);
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [showNewRole, setShowNewRole] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const togglePermission = (module: string, perm: string) => {
    if (!editMode) return;
    setMatrix((prev) => {
      const rolePerm = prev[selectedRole.name]?.[module] || [];
      const updated = rolePerm.includes(perm)
        ? rolePerm.filter((p) => p !== perm)
        : [...rolePerm, perm];
      return {
        ...prev,
        [selectedRole.name]: { ...prev[selectedRole.name], [module]: updated },
      };
    });
  };

  const hasPermission = (module: string, perm: string) =>
    matrix[selectedRole.name]?.[module]?.includes(perm) ?? false;

  const toggleAllModule = (module: string) => {
    if (!editMode) return;
    const current = matrix[selectedRole.name]?.[module] || [];
    const allPerms = PERMISSIONS.map(p => p.key);
    const allSelected = allPerms.every(p => current.includes(p));
    setMatrix(prev => ({
      ...prev,
      [selectedRole.name]: {
        ...prev[selectedRole.name],
        [module]: allSelected ? [] : allPerms,
      },
    }));
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage access control for {ROLES.length} roles</p>
        </div>
        <Button
          onClick={() => setShowNewRole(true)}
          className="gradient-primary border-0 hover:opacity-90 gap-2 font-medium"
        >
          <Plus className="w-4 h-4" /> New Role
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Roles list */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Roles</h3>
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => { setSelectedRole(role); setEditMode(false); }}
              className={`w-full text-left rounded-xl border p-3.5 transition-all group ${
                selectedRole.id === role.id
                  ? "border-primary bg-primary-muted shadow-sm"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${selectedRole.id === role.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${selectedRole.id === role.id ? "text-primary" : "text-foreground"}`}>
                    {role.name}
                  </span>
                </div>
                {role.system && (
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">System</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{role.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{role.userCount} users</span>
                {!role.system && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:text-primary transition-colors text-muted-foreground">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:text-destructive transition-colors text-muted-foreground">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`text-xs px-2.5 py-1 rounded-full font-semibold ${selectedRole.color}`}>
                {selectedRole.name}
              </div>
              <span className="text-sm text-muted-foreground">permission matrix</span>
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setMatrix(DEFAULT_MATRIX); setEditMode(false); }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-xs gradient-primary border-0" onClick={() => setEditMode(false)}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setEditMode(true)}
                  disabled={selectedRole.system}
                >
                  <Edit2 className="w-3 h-3" />
                  {selectedRole.system ? "System Role" : "Edit Permissions"}
                </Button>
              )}
            </div>
          </div>

          {editMode && (
            <div className="px-5 py-2.5 bg-warning-muted border-b border-warning/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-warning flex-shrink-0" />
              <span className="text-xs text-warning font-medium">
                Editing permissions for <strong>{selectedRole.name}</strong>. Changes affect all {selectedRole.userCount} users in this role.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 w-36">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module</span>
                  </th>
                  {PERMISSIONS.map((p) => (
                    <th key={p.key} className="text-center px-4 py-3 w-20">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{p.label}</span>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 w-20">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODULES.map((module) => {
                  const allSelected = PERMISSIONS.every(p => hasPermission(module, p.key));
                  return (
                    <tr key={module} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          <span className="text-sm font-medium text-foreground">{module}</span>
                        </div>
                      </td>
                      {PERMISSIONS.map((p) => (
                        <td key={p.key} className="text-center px-4 py-3.5">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={hasPermission(module, p.key)}
                              onCheckedChange={() => togglePermission(module, p.key)}
                              disabled={!editMode}
                              className={`${!editMode ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                            />
                          </div>
                        </td>
                      ))}
                      <td className="text-center px-4 py-3.5">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => toggleAllModule(module)}
                            disabled={!editMode}
                            className={`${!editMode ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Role Dialog */}
      <Dialog open={showNewRole} onOpenChange={setShowNewRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role Name</Label>
              <Input placeholder="e.g. Content Manager" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Input placeholder="Brief description of this role's purpose" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Base Template</Label>
              <p className="text-xs text-muted-foreground">Inherit permissions from an existing role as a starting point.</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    className="text-left p-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-muted transition-all text-xs font-medium text-foreground"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewRole(false)}>Cancel</Button>
            <Button className="gradient-primary border-0 hover:opacity-90 font-medium">Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
