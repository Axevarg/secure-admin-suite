import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  permission?: string; // 🔥 permiso requerido opcional
}

const getStorage = () => {
  if (localStorage.getItem("token")) return localStorage;
  if (sessionStorage.getItem("token")) return sessionStorage;
  return null;
};

const ProtectedRoute = ({ children, permission }: Props) => {
  const storage = getStorage();

  // 🚫 no logueado
  if (!storage) {
    return <Navigate to="/login" replace />;
  }

  // 👤 obtener permisos guardados
  const permissions = JSON.parse(storage.getItem("permissions") || "[]");

  // 🔒 validar permiso si la ruta lo requiere
  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
