import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import RolesPermissions from "./pages/RolesPermissions";
import NotFound from "./pages/NotFound";
import ActivateAccount from "./pages/auth/ActivateAccount";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import ResetPassword from "./pages/auth/ResetPassword";
import ClientesPage from "./pages/ClientesPage";
import ObrasPage from "./pages/ObrasPage";
import EspecialidadesPage from "./pages/EspecialidadesPage";
import TrabajadoresPage from "./pages/TrabajadoresPage";
import ConstratistasPage from "./pages/ContratistasPage";
import ObraDashboard from "./pages/Obras/ObraDashboard";
import ObraPersonalPage from "./pages/Obras/ObraPersonalPage";
import AsistenciaPage from "./pages/Obras/AsistenciaPage";
import InsumosPage from "./pages/Obras/InsumosPage";
import RequisicionesPage from "./pages/Obras/RequisicionesPage";
import RequisicionDetallePage from "./pages/Obras/RequisicionDetallePage";
import ProveedoresPage from "./pages/ProveedoresPage";
import AprobacionesPage from "./pages/AprobacionesPage";
import RemesasPage from "./pages/RemesasPage";
import EvidenciasPage from "./pages/Obras/EvidenciasRemesa";
import BancosDashboard from "./pages/BancosDashboard";
import BancosCuentas from "./pages/Bancoscuentas";
import BancosMovimientos from "./pages/Bancosmovimientos ";
import ColaboradoresLista from "./pages/ColaboradoresPage";
import ColaboradorPerfil from "./pages/ColaboradorPerfil";
import ColaboradorForm from "./pages/ColaboradorForm";
import NominaLista from "./pages/Nominalista";
import NominaDetalle from "./pages/Nominadetalle";
import CumpleanosPage from "@/pages/CumpleanosPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🌍 públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activate" element={<ActivateAccount />} />

          {/* 🔐 Layout protegido (solo login) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* 📊 Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute permission="dashboard:view">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* 👥 Usuarios */}
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute permission="usuarios:view">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            {/* 👥 Roles */}
            <Route
              path="/roles"
              element={
                <ProtectedRoute permission="usuarios:view">
                  <RolesPermissions />
                </ProtectedRoute>
              }
            />
            {/* 👥 Clientes */}
            <Route
              path="/clientes"
              element={
                <ProtectedRoute permission="clientes:view">
                  <ClientesPage />
                </ProtectedRoute>
              }
            />
            {/* 👥 Proveedores */}
            <Route
              path="/proveedores"
              element={
                <ProtectedRoute permission="proveedores:view">
                  <ProveedoresPage />
                </ProtectedRoute>
              }
            />

            <Route path="/cumpleanos" element={<CumpleanosPage />} />
            {/* Obras */}
            <Route
              path="/obras"
              element={
                <ProtectedRoute permission="obras:view">
                  <ObrasPage />
                </ProtectedRoute>
              }
            />
            {/* Remesas */}
            <Route
              path="/remesas"
              element={
                <ProtectedRoute permission="remesas:view">
                  <RemesasPage />
                </ProtectedRoute>
              }
            />

            {/* Obra (workspace) — mismos perms que obraNav en AppSidebar */}
            <Route
              path="/obras/:id/dashboard"
              element={
                <ProtectedRoute permission="obra_dashboard:view">
                  <ObraDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id/personal"
              element={
                <ProtectedRoute permission="trabajadores:view">
                  <ObraPersonalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id/asistencia"
              element={
                <ProtectedRoute permission="asistencia:view">
                  <AsistenciaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id/insumos"
              element={
                <ProtectedRoute permission="presupuesto:view">
                  <InsumosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id/evidencias"
              element={
                <ProtectedRoute permission="evidencias:view">
                  <EvidenciasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id/requisiciones"
              element={
                <ProtectedRoute permission="requisiciones:view">
                  <RequisicionesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requisiciones/:reqId"
              element={
                <ProtectedRoute permission="requisiciones:view">
                  <RequisicionDetallePage />
                </ProtectedRoute>
              }
            />

            {/* Especialidades */}
            <Route
              path="/especialidades"
              element={
                <ProtectedRoute permission="especialidades:view">
                  <EspecialidadesPage />
                </ProtectedRoute>
              }
            />
            {/* Tabajadores */}
            <Route
              path="/trabajadores"
              element={
                <ProtectedRoute permission="trabajadores:view">
                  <TrabajadoresPage />
                </ProtectedRoute>
              }
            />
            {/* Contratistas */}
            <Route
              path="/contratistas"
              element={
                <ProtectedRoute permission="contratistas:view">
                  <ConstratistasPage />
                </ProtectedRoute>
              }
            />

            {/* Bancos — módulo propio, separado de Remesas */}
            <Route
              path="/bancos"
              element={
                <ProtectedRoute permission="bancos:view">
                  <BancosDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bancos/cuentas"
              element={
                <ProtectedRoute permission="bancos:view">
                  <BancosCuentas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bancos/movimientos"
              element={
                <ProtectedRoute permission="bancos:view">
                  <BancosMovimientos />
                </ProtectedRoute>
              }
            />

            {/* Colaboradores / Nómina */}
            <Route
              path="/colaboradores/nuevo"
              element={
                <ProtectedRoute permission="rh:view">
                  <ColaboradorForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores/:id"
              element={
                <ProtectedRoute permission="rh:view">
                  <ColaboradorPerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <ProtectedRoute permission="rh:view">
                  <ColaboradoresLista />
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores/:id/editar"
              element={
                <ProtectedRoute permission="rh:view">
                  <ColaboradorForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nomina"
              element={
                <ProtectedRoute permission="rh:approve">
                  <NominaLista />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nomina/:id"
              element={
                <ProtectedRoute permission="rh:approve">
                  <NominaDetalle />
                </ProtectedRoute>
              }
            />

            {/* 🔐 Aprobaciones */}
            <Route
              path="/aprobaciones"
              element={
                <ProtectedRoute permission="aprobaciones:view">
                  <AprobacionesPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;