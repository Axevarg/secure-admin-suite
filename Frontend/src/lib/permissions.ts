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
