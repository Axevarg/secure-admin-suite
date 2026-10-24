import app from "./App.js";
import express from "express";
import 'dotenv/config';
import usersRoutes from "./routes/users.router.js";
import rolesRoutes from "./routes/roles.router.js";
import clientesRoutes from "./routes/clientes.routes.js";
import obrasRoutes from "./routes/obras.router.js";
import especialidadesRoutes from "./routes/especialidades.routes.js";
import trabajadoresRoutes from "./routes/trabajadores.routes.js";
import contratistasRoutes from "./routes/contratistas.routes.js";
import asignacionesRoutes from "./routes/asignaciones.routes.js";
import asistenciasRoutes from "./routes/asistencias.routes.js";
import insumosRoutes from "./routes/insumos.routes.js";
import proveedoresRoutes from "./routes/proveedores.routes.js";
import requisicionesRoutes from "./routes/requisiciones.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import aprobacionesRoutes from "./routes/aprobaciones.routes.js";
import remesasRoutes from "./routes/remesas.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import obraDashboardRoutes from "./routes/obraDashboard.routes.js";
import evidenciasRoutes from "./routes/evidencias.routes.js";
import bancosRouter from "./routes/bancos.routes.js";
import colaboradoresRouter from "./routes/colaboradores.routes.js";
import nominaRouter from "./routes/nomina.routes.js";
import indirectosRoutes from "./routes/indirectos.routes.js";
import biometriaRoutes from "./routes/biometria.routes.js";
import { iniciarGeocodificacion } from "./utils/geocodificacion.js";
import cors from "cors";

app.use(cors({
  origin: "*", 
  exposedHeaders: ["Content-Type"],
}));

app.use("/roles", rolesRoutes);
app.use("/users", usersRoutes);
app.use("/clientes", clientesRoutes);
app.use("/obras", obrasRoutes);
app.use("/especialidades", especialidadesRoutes);
app.use("/trabajadores", trabajadoresRoutes);
app.use("/contratistas", contratistasRoutes);
app.use("/", asignacionesRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/insumos", insumosRoutes);
app.use("/proveedores", proveedoresRoutes);
app.use("/requisiciones", requisicionesRoutes);
app.use("/stock", stockRoutes);
app.use("/validacion-requisiciones", aprobacionesRoutes);
app.use("/remesas", remesasRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api", obraDashboardRoutes);
app.use("/bancos", bancosRouter);
app.use("/colaboradores", colaboradoresRouter);
app.use("/nomina", nominaRouter);
app.use("/indirectos", indirectosRoutes);
app.use("/biometria", biometriaRoutes);
app.use(express.json());
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static("uploads"));
app.use("/evidencias", evidenciasRoutes);


const PORT = 3001;

app.listen(PORT, () => {
  console.log("API running on port " + PORT);
  // 📍 Dirección en texto de las marcas de la app (en segundo plano)
  iniciarGeocodificacion();
});
