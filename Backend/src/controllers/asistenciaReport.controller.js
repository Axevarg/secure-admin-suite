import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { marcasTieneDireccion } from "../utils/columnas.js";
import { obtenerUnidadesAccesibles } from "../utils/unidades.js";

// Texto y liga a Google Maps de la marca que dio la entrada/salida:
// dirección si ya se geocodificó, si no las coordenadas.
const ubicacionDe = (direccion, lat, lng) => {
  const la = lat == null ? NaN : Number(lat);
  const ln = lng == null ? NaN : Number(lng);
  const coords =
    Number.isFinite(la) && Number.isFinite(ln)
      ? `${la.toFixed(6)}, ${ln.toFixed(6)}`
      : null;

  return {
    texto: direccion || coords || "Sin ubicación",
    link: coords
      ? `https://www.google.com/maps?q=${la.toFixed(6)},${ln.toFixed(6)}`
      : null,
  };
};

export const generarReporteAsistenciasPDF = async (req, res) => {
  try {
    const { obraId } = req.params;
    const { tipo, fechaInicio, fechaFin } = req.query;
    const unidades = await obtenerUnidadesAccesibles(req.user.id, obraId);
    if (unidades === null) return res.status(403).json({ message: "No tienes acceso a esta obra" });
    const unidadIds = unidades.map((unidad) => unidad.id);

    let start;
    let end;
    const hoy = dayjs();

    // 📅 Determinar rango automáticamente
    if (tipo === "dia") {
      start = dayjs(fechaInicio).startOf("day");
      end = dayjs(fechaInicio).endOf("day");
    } else if (tipo === "semana") {
      start = hoy.startOf("week");
      end = hoy.endOf("week");
    } else if (tipo === "mes") {
      start = hoy.startOf("month");
      end = hoy.endOf("month");
    } else if (tipo === "rango") {
      start = dayjs(fechaInicio).startOf("day");
      end = dayjs(fechaFin).endOf("day");
    } else {
      start = hoy.startOf("day");
      end = hoy.endOf("day");
    }

    const colDireccion = (await marcasTieneDireccion())
      ? "m.direccion"
      : "NULL::text AS direccion";

    // 🔍 Obtener datos de asistencias y nombre de la obra para el Header
    // La ubicación sale de la primera marca de entrada y la última de salida del día.
    const [asistenciasRes, obraRes] = await Promise.all([
      pool.query(`
        SELECT 
          a.fecha,
          a.unidad_id,
          a.trabajador_id,
          u.nombre AS unidad_nombre,
          t.nombre,
          a.estado,
          a.horas_trabajadas,
          a.horas_extra,
          to_char(a.hora_entrada::time, 'HH24:MI') AS hora_entrada,
          to_char(a.hora_salida::time, 'HH24:MI') AS hora_salida,
          me.lat AS lat_entrada,
          me.lng AS lng_entrada,
          me.direccion AS direccion_entrada,
          ms.lat AS lat_salida,
          ms.lng AS lng_salida,
          ms.direccion AS direccion_salida
        FROM asistencias a
        JOIN trabajadores t ON t.id = a.trabajador_id
        JOIN obra_unidades u ON u.id = a.unidad_id AND u.obra_id = a.obra_id
        LEFT JOIN LATERAL (
          SELECT m.lat, m.lng, ${colDireccion}
          FROM asistencia_marcas m
          WHERE m.trabajador_id = a.trabajador_id AND m.obra_id = a.obra_id
            AND m.unidad_id = a.unidad_id
            AND m.fecha = a.fecha AND m.tipo = 'entrada' AND m.estado = 'aplicada'
          ORDER BY m.marcado_en ASC
          LIMIT 1
        ) me ON true
        LEFT JOIN LATERAL (
          SELECT m.lat, m.lng, ${colDireccion}
          FROM asistencia_marcas m
          WHERE m.trabajador_id = a.trabajador_id AND m.obra_id = a.obra_id
            AND m.unidad_id = a.unidad_id
            AND m.fecha = a.fecha AND m.tipo = 'salida' AND m.estado = 'aplicada'
          ORDER BY m.marcado_en DESC
          LIMIT 1
        ) ms ON true
        WHERE a.obra_id = $1
        AND a.fecha BETWEEN $2 AND $3
        AND a.unidad_id = ANY($4::bigint[])
        ORDER BY u.nombre ASC, a.fecha ASC, t.nombre ASC
      `, [obraId, start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"), unidadIds]),
      pool.query(`SELECT nombre FROM obras WHERE id = $1`, [obraId])
    ]);

    const nombreObra = obraRes.rows[0]?.nombre || `OBRA ID: ${obraId}`;

    // 📄 Inicializar PDF en A4
    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4",
      bufferPages: true // Permite numerar páginas al final
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=reporte-asistencias-${obraId}.pdf`);
    doc.pipe(res);

    // 🎨 Paleta de Colores Constructora / SIGO
    const COLOR_PRIMARY = "#1E293B"; // Slate 800
    const COLOR_ACCENT = "#DC2626";  // Red 600
    const COLOR_TEXT = "#334155";    // Slate 700
    const COLOR_MUTED = "#64748B";   // Slate 500
    const COLOR_BG_HEADER = "#F1F5F9"; // Slate 100
    const COLOR_ROW_ALT = "#F8FAFC";  // Slate 50

    // --- FUNCIÓN PARA GENERAR EL ENCABEZADO DE PÁGINA ---
    const pintarHeaderPersonalizado = () => {
      // Línea decorativa superior roja
      doc.rect(0, 0, doc.page.width, 12).fill(COLOR_ACCENT);

      // Bloque identificador corporativo
      doc.fillColor(COLOR_PRIMARY);
      doc.font("Helvetica-Bold").fontSize(20).text("CONSTRUCTORA ILIASA", 40, 35, { characterSpacing: 1 });
      
      doc.fillColor(COLOR_MUTED);
      doc.font("Helvetica-Bold").fontSize(8).text("SISTEMA INTEGRAL DE GESTIÓN DE OBRA (SIGO)", 40, 58, { characterSpacing: 2 });

      // Título del reporte (Derecha)
      doc.fillColor(COLOR_PRIMARY);
      doc.font("Helvetica-Bold").fontSize(12).text("REPORTE DE ASISTENCIAS", 350, 37, { align: "right", width: 205 });
      
      // Periodo técnico
      doc.fillColor(COLOR_MUTED);
      doc.font("Helvetica").fontSize(9).text(
        `PERIODO: ${start.format("DD/MM/YYYY")} AL ${end.format("DD/MM/YYYY")}`, 
        350, 54, { align: "right", width: 205 }
      );

      // Divisor elegante
      doc.moveTo(40, 75).lineTo(555, 75).lineWidth(1).strokeColor("#E2E8F0").stroke();

      // Detalles específicos de la Obra (Meta-información)
      doc.rect(40, 88, 515, 36).fill(COLOR_BG_HEADER);
      
      doc.fillColor(COLOR_PRIMARY).font("Helvetica-Bold").fontSize(9).text("CONTRATO / OBRA:", 52, 95);
      doc.fillColor(COLOR_TEXT).font("Helvetica").fontSize(9).text(nombreObra.toUpperCase(), 155, 95);

      doc.fillColor(COLOR_PRIMARY).font("Helvetica-Bold").fontSize(9).text("FECHA EMISIÓN:", 52, 110);
      doc.fillColor(COLOR_TEXT).font("Helvetica").fontSize(9).text(dayjs().format("DD/MM/YYYY HH:mm"), 155, 110);

      // Encabezados de la Tabla
      const tableHeaderY = 142;
      doc.rect(40, tableHeaderY, 515, 22).fill(COLOR_PRIMARY);

      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
      doc.text("FECHA", 48, tableHeaderY + 7, { width: 55 });
      doc.text("TRABAJADOR", 105, tableHeaderY + 7, { width: 150 });
      doc.text("ESTADO", 258, tableHeaderY + 7, { width: 70, align: "center" });
      doc.text("ENTRADA", 330, tableHeaderY + 7, { width: 50, align: "center" });
      doc.text("SALIDA", 382, tableHeaderY + 7, { width: 50, align: "center" });
      doc.text("HRS TRAB.", 434, tableHeaderY + 7, { width: 58, align: "center" });
      doc.text("HRS EXTRA", 494, tableHeaderY + 7, { width: 58, align: "center" });
      
      // Restablecer posición base de renderizado de filas
      doc.y = tableHeaderY + 22;
    };

    // Pintar primer encabezado
    pintarHeaderPersonalizado();

    const pintarEncabezadoUnidad = (nombre, cantidad) => {
      const y = doc.y;
      doc.rect(40, y, 515, 19).fill(COLOR_BG_HEADER);
      doc.fillColor(COLOR_PRIMARY).font("Helvetica-Bold").fontSize(8.5)
        .text(`UNIDAD: ${(nombre || "Sin unidad").toUpperCase()}`, 48, y + 5, { width: 360, ellipsis: true });
      doc.fillColor(COLOR_MUTED).font("Helvetica-Bold").fontSize(7.5)
        .text(`${cantidad} trabajadores`, 420, y + 5, { width: 125, align: "right" });
      doc.y = y + 19;
    };

    // --- RENDERIZADO DE FILAS DINÁMICAS ---
    let index = 0;

    const asistenciasPorUnidad = new Map();
    for (const asistencia of asistenciasRes.rows) {
      const key = asistencia.unidad_id;
      const grupo = asistenciasPorUnidad.get(key) || {
        nombre: asistencia.unidad_nombre || "Sin unidad",
        filas: [],
      };
      grupo.filas.push(asistencia);
      grupo.trabajadores = grupo.trabajadores || new Set();
      grupo.trabajadores.add(asistencia.trabajador_id);
      asistenciasPorUnidad.set(key, grupo);
    }

    for (const grupo of asistenciasPorUnidad.values()) {
      if (doc.y > 735) {
        doc.addPage();
        pintarHeaderPersonalizado();
      }
      pintarEncabezadoUnidad(grupo.nombre, grupo.trabajadores.size);

      for (const r of grupo.filas) {
        // Las filas ocupan 32 puntos, con ubicación en una segunda línea.
        if (doc.y > 760) {
          doc.addPage();
          pintarHeaderPersonalizado();
          pintarEncabezadoUnidad(grupo.nombre, grupo.trabajadores.size);
        }

        const currentY = doc.y;
        const ROW_H = 32;

        if (index % 2 === 1) {
          doc.rect(40, currentY, 515, ROW_H).fill(COLOR_ROW_ALT);
        }

        doc.moveTo(40, currentY + ROW_H).lineTo(555, currentY + ROW_H).lineWidth(0.5).strokeColor("#F1F5F9").stroke();
        doc.fillColor(COLOR_TEXT).font("Helvetica").fontSize(8.5);
        doc.text(dayjs(r.fecha).format("DD/MM/YYYY"), 48, currentY + 6, { width: 55 });

        doc.font("Helvetica-Bold").fillColor(COLOR_PRIMARY);
        doc.text(r.nombre.toUpperCase(), 105, currentY + 6, { width: 150, height: 11, ellipsis: true });

        const estadoNormalizado = (r.estado || "").toLowerCase().trim();
        if (estadoNormalizado === "falta" || estadoNormalizado === "retardo") {
          doc.fillColor(COLOR_ACCENT).font("Helvetica-Bold");
        } else if (estadoNormalizado === "asistencia") {
          doc.fillColor("#16A34A").font("Helvetica-Bold");
        } else {
          doc.fillColor(COLOR_MUTED).font("Helvetica");
        }
        doc.text(r.estado.toUpperCase(), 258, currentY + 6, { width: 70, align: "center" });

        doc.fillColor(COLOR_TEXT).font("Helvetica");
        doc.text(r.hora_entrada || "--", 330, currentY + 6, { width: 50, align: "center" });
        doc.text(r.hora_salida || "--", 382, currentY + 6, { width: 50, align: "center" });
        doc.text(r.horas_trabajadas || "0", 434, currentY + 6, { width: 58, align: "center" });
        doc.text(r.horas_extra || "0", 494, currentY + 6, { width: 58, align: "center" });

        const pintarUbicacion = (etiqueta, ubic, x) => {
          doc.font("Helvetica-Bold").fontSize(7).fillColor(COLOR_MUTED);
          doc.text(etiqueta, x, currentY + 19, { width: 52, lineBreak: false });
          doc.font("Helvetica").fillColor(ubic.link ? "#2563EB" : COLOR_MUTED);
          doc.text(ubic.texto, x + 52, currentY + 19, {
            width: 200,
            height: 9,
            ellipsis: true,
            link: ubic.link,
            underline: Boolean(ubic.link),
          });
        };
        pintarUbicacion("UBIC. ENT.:", ubicacionDe(r.direccion_entrada, r.lat_entrada, r.lng_entrada), 48);
        pintarUbicacion("UBIC. SAL.:", ubicacionDe(r.direccion_salida, r.lat_salida, r.lng_salida), 300);

        doc.y = currentY + ROW_H;
        index++;
      }
    }

    // Mensaje de contingencia si no hay incidencias en el rango
    if (asistenciasRes.rows.length === 0) {
      doc.rect(40, doc.y, 515, 40).fill(COLOR_ROW_ALT);
      doc.fillColor(COLOR_MUTED)
         .font("Helvetica-Oblique")
         .fontSize(9)
         .text("No se registraron datos de asistencia en el periodo seleccionado.", 40, doc.y + 15, { align: "center", width: 515 });
    }

    // --- PIE DE PÁGINA GLOBAL (Paginación Dinámica) ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Línea sobre el pie de página
      doc.moveTo(40, 800).lineTo(555, 800).lineWidth(0.5).strokeColor("#E2E8F0").stroke();
      
      doc.fillColor(COLOR_MUTED)
         .font("Helvetica")
         .fontSize(7.5)
         .text("Documento interno generado de manera automática por SIGO. Confidencial.", 40, 808);
         
      doc.text(`PÁGINA ${i + 1} DE ${range.count}`, 350, 808, { align: "right", width: 205 });
    }

    doc.end();

  } catch (err) {
    console.error("Error crítico generando PDF:", err);
    res.status(500).json({ message: "Error interno al estructurar el reporte técnico." });
  }
};
