export const useAuth = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
  };
};