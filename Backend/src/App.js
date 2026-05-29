import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
  origin: process.env.APP_URL || "http://192.168.100.233:8080",  
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// rutas DESPUÉS de crear app
app.use("/auth", authRoutes);

export default app;