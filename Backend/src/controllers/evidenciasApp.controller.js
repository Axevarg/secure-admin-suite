import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { pool } from "../config/db.js";

const MAX_BYTES = 12 * 1024 * 1024;
const TIPOS = new Set(["entrega", "comprobante"]);
const storageDir = path.resolve("uploads/evidencias-app");
const escaparSvg = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

export const uploadEvidenciaApp = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, done) => {
    if (file.mimetype !== "image/jpeg") return done(new Error("Solo se aceptan fotos tomadas con la cámara (JPEG)."));
    done(null, true);
  },
});

export const crearEvidenciaApp = async (req, res) => {
  let destino;
  try {
    const titulo = typeof req.body.titulo === "string" ? req.body.titulo.trim() : "";
    const tipo = req.body.tipo;
    const capturadaEn = new Date(req.body.capturada_en);
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    const precision = req.body.precision_m === "" || req.body.precision_m == null ? null : Number(req.body.precision_m);
    const evidenciaId = req.body.evidencia_id ? Number(req.body.evidencia_id) : null;

    if (!titulo || titulo.length > 160) return res.status(400).json({ message: "El título es obligatorio y admite hasta 160 caracteres" });
    if (!TIPOS.has(tipo)) return res.status(400).json({ message: "Selecciona entrega o comprobante" });
    if (!req.file || !req.file.buffer?.length) return res.status(400).json({ message: "Toma una fotografía para continuar" });
    if (!Number.isFinite(capturadaEn.getTime()) || Math.abs(Date.now() - capturadaEn.getTime()) > 5 * 60 * 1000) {
      return res.status(400).json({ message: "La fecha de captura no es válida o la foto es demasiado antigua" });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ message: "Se requiere ubicación válida al tomar la fotografía" });
    }
    if (precision != null && (!Number.isFinite(precision) || precision < 0 || precision > 1000)) {
      return res.status(400).json({ message: "La precisión de ubicación es inválida" });
    }
    if (evidenciaId != null && (!Number.isSafeInteger(evidenciaId) || evidenciaId < 1)) {
      return res.status(400).json({ message: "La evidencia relacionada no es válida" });
    }
    const original = await sharp(req.file.buffer, { failOn: "error", limitInputPixels: 40000000 }).rotate().jpeg({ quality: 90 }).toBuffer();
    const hash = crypto.createHash("sha256").update(original).digest("hex");
    const existing = await pool.query(
      "SELECT id FROM evidencias_app WHERE sha256=$1 UNION ALL SELECT foto_id AS id FROM evidencias_app_fotos WHERE sha256=$1 LIMIT 1",
      [hash],
    );
    if (existing.rows.length) return res.status(409).json({ message: "Esta fotografía ya fue registrada como evidencia" });

    if (evidenciaId != null) {
      const parent = await pool.query("SELECT id FROM evidencias_app WHERE id=$1 AND usuario_id=$2", [evidenciaId, req.user.id]);
      if (!parent.rows.length) return res.status(404).json({ message: "No se encontró la evidencia para agregar esta fotografía" });
      const sameType = await pool.query("SELECT 1 FROM evidencias_app WHERE id=$1 AND tipo=$2 UNION ALL SELECT 1 FROM evidencias_app_fotos WHERE evidencia_id=$1 AND tipo=$2 LIMIT 1", [evidenciaId, tipo]);
      if (sameType.rows.length) return res.status(409).json({ message: `La foto de ${tipo} ya está agregada a esta evidencia` });
    }

    await fs.mkdir(storageDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.jpg`;
    destino = path.join(storageDir, filename);
    const dimensiones = await sharp(original).metadata();
    const width = dimensiones.width ?? 1280;
    const height = 118;
    const marca = `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#0f172a" fill-opacity="0.88"/><text x="26" y="43" fill="white" font-family="Arial,sans-serif" font-size="25" font-weight="700">EVIDENCIA SIGO · ${escaparSvg(tipo === "entrega" ? "ENTREGA" : "COMPROBANTE")}</text><text x="26" y="77" fill="#fecaca" font-family="Arial,sans-serif" font-size="21">${escaparSvg(capturadaEn.toLocaleString("es-MX", { timeZone: "America/Mexico_City" }))} · ${lat.toFixed(6)}, ${lng.toFixed(6)}</text><text x="26" y="103" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="15">Precisión GPS: ${precision == null ? "no disponible" : `${Math.round(precision)} m`}</text></svg>`;
    const final = await sharp(original).composite([{ input: Buffer.from(marca), gravity: "south" }]).jpeg({ quality: 88 }).toBuffer();
    await fs.writeFile(destino, final, { flag: "wx" });
    if (evidenciaId != null) {
      const result = await pool.query(
        `INSERT INTO evidencias_app_fotos
          (evidencia_id, tipo, nombre_archivo, url, mime_type, sha256, capturada_en, lat, lng, precision_m)
         VALUES ($1,$2,$3,$4,'image/jpeg',$5,$6,$7,$8,$9)
         RETURNING foto_id, evidencia_id`,
        [evidenciaId, tipo, filename, `/uploads/evidencias-app/${filename}`, hash, capturadaEn.toISOString(), lat, lng, precision],
      );
      return res.status(201).json(result.rows[0]);
    }
    const result = await pool.query(
      `INSERT INTO evidencias_app
        (usuario_id, titulo, tipo, nombre_archivo, url, mime_type, sha256, capturada_en, lat, lng, precision_m)
       VALUES ($1,$2,$3,$4,$5,'image/jpeg',$6,$7,$8,$9,$10)
       RETURNING id, usuario_id, titulo, tipo, nombre_archivo, url, mime_type,
                 sha256, capturada_en, lat, lng, precision_m, created_at`,
      [req.user.id, titulo, tipo, filename, `/uploads/evidencias-app/${filename}`, hash, capturadaEn.toISOString(), lat, lng, precision],
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (destino) await fs.unlink(destino).catch(() => undefined);
    if (err.code === "23505") return res.status(409).json({ message: "Esta fotografía ya fue registrada como evidencia" });
    if (err.code === "23503") return res.status(404).json({ message: "El usuario ya no existe" });
    console.error("CREATE APP EVIDENCE ERROR:", err);
    return res.status(500).json({ message: "No se pudo guardar la evidencia" });
  }
};

export const listarEvidenciasApp = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.usuario_id, u.name AS usuario, e.titulo, e.created_at,
              jsonb_build_array(jsonb_build_object(
                'id', e.id, 'tipo', e.tipo, 'sha256', e.sha256, 'capturada_en', e.capturada_en,
                'lat', e.lat, 'lng', e.lng, 'precision_m', e.precision_m, 'direccion', e.direccion
              )) || COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id', f.foto_id, 'tipo', f.tipo, 'sha256', f.sha256, 'capturada_en', f.capturada_en,
                  'lat', f.lat, 'lng', f.lng, 'precision_m', f.precision_m, 'direccion', f.direccion
                ) ORDER BY f.capturada_en)
                FROM evidencias_app_fotos f WHERE f.evidencia_id=e.id
              ), '[]'::jsonb) AS fotos
       FROM evidencias_app e JOIN users u ON u.id=e.usuario_id
       ORDER BY e.capturada_en DESC LIMIT 300`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("LIST APP EVIDENCES ERROR:", err);
    return res.status(500).json({ message: "No se pudieron cargar las evidencias" });
  }
};

export const verArchivoEvidenciaApp = async (req, res) => {
  try {
    const result = req.params.tipo
      ? await pool.query(
        "SELECT url FROM evidencias_app WHERE id=$1 AND tipo=$2 UNION ALL SELECT url FROM evidencias_app_fotos WHERE evidencia_id=$1 AND tipo=$2 LIMIT 1",
        [req.params.evidenciaId, req.params.tipo],
      )
      : await pool.query("SELECT url FROM evidencias_app WHERE id=$1", [req.params.evidenciaId]);
    if (!result.rows[0]) return res.status(404).json({ message: "Evidencia no encontrada" });
    const filename = path.basename(result.rows[0].url);
    return res.sendFile(path.join(storageDir, filename), { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    console.error("VIEW APP EVIDENCE ERROR:", err);
    return res.status(500).json({ message: "No se pudo abrir la evidencia" });
  }
};
