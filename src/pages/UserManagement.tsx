import { useState } from "react";
import {
  ChevronDown,
  Edit2,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const USERS = [
  { id: 1, name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Super Admin", status: "active", lastActivity: "Just now", avatar: "SC" },
  { id: 2, name: "James Kowalski", email: "james.k@acme.com", role: "Admin", status: "active", lastActivity: "5m ago", avatar: "JK" },
  { id: 3, name: "Lisa Martinez", email: "lisa.m@acme.com", role: "Editor", status: "active", lastActivity: "23m ago", avatar: "LM" },
  { id: 4, name: "Tom Bergmann", email: "tom.b@acme.com", role: "Viewer", status: "inactive", lastActivity: "3d ago", avatar: "TB" },
  { id: 5, name: "Priya Nair", email: "priya.n@acme.com", role: "Editor", status: "active", lastActivity: "1h ago", avatar: "PN" },
  { id: 6, name: "Alex Johnson", email: "alex.j@acme.com", role: "Admin", status: "suspended", lastActivity: "7d ago", avatar: "AJ" },
  { id: 7, name: "Chloe Dupont", email: "chloe.d@acme.com", role: "Viewer", status: "active", lastActivity: "2h ago", avatar: "CD" },
  { id: 8, name: "Marcus Lee", email: "marcus.l@acme.com", role: "Editor", status: "inactive", lastActivity: "14d ago", avatar: "ML" },
];

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-primary text-primary-foreground",
  "Admin": "bg-primary/15 text-primary",
  "Editor": "bg-success-muted text-success",
  "Viewer": "bg-muted text-muted-foreground",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success-muted text-success",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive",
};

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<typeof USERS[0] | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const filtered = USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id: number) =>
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const openEdit = (user: typeof USERS[0]) => {
    setEditUser(user);
    setShowModal(true);
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{USERS.length} users total · {USERS.filter(u => u.status === "active").length} active</p>
        </div>
        <Button
          onClick={() => { setEditUser(null); setShowModal(true); }}
          className="gradient-primary border-0 hover:opacity-90 gap-2 font-medium"
        >
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 text-sm w-36">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">{selectedUsers.length} selected</span>
            <Button variant="outline" size="sm" className="h-7 text-xs">Change Role</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">Delete Selected</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    onChange={(e) => setSelectedUsers(e.target.checked ? USERS.map(u => u.id) : [])}
                    checked={selectedUsers.length === USERS.length}
                  />
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                    User <ChevronDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-left px-3 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
                </th>
                <th className="text-left px-3 py-3 hidden sm:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                </th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Activity</span>
                </th>
                <th className="text-right px-5 py-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary-foreground">{user.avatar}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.name}</div>
                        <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{user.lastActivity}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                          <Eye className="w-4 h-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => openEdit(user)}>
                          <Edit2 className="w-4 h-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="w-4 h-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No users match your filters</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {USERS.length} users
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-primary text-primary-foreground border-primary">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editUser ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">First Name</Label>
                <Input placeholder="Sarah" defaultValue={editUser?.name.split(" ")[0]} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Last Name</Label>
                <Input placeholder="Chen" defaultValue={editUser?.name.split(" ")[1]} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input type="email" placeholder="user@company.com" defaultValue={editUser?.email} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role</Label>
              <Select defaultValue={editUser?.role || "Viewer"}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select defaultValue={editUser?.status || "active"}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editUser && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Temporary Password</Label>
                <Input type="password" placeholder="Min. 12 characters" className="h-9" />
                <p className="text-xs text-muted-foreground">User will be prompted to change on first login.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="gradient-primary border-0 hover:opacity-90 font-medium">
              {editUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
