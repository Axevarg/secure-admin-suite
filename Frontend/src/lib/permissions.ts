export const getPermissions = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
};

export const hasPermission = (permission: string) => {
  const perms = getPermissions();
  return perms.includes(permission) || perms.includes("system:admin");
};

// Permiso que da acceso a los datos de pago (sueldo, banco, CLABE).
// Es el mismo que protege el menú "Nomina" en AppSidebar.
export const PERMISO_PAGO = "rh:approve";

export function leerPermisos(): string[] {
  try {
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    const lista = JSON.parse(storage.getItem("permissions") || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export const tienePermiso = (perm: string) => leerPermisos().includes(perm);