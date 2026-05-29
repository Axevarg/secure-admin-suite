import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, role }: any) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}