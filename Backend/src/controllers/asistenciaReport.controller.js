import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

export const generarReporteAsistenciasPDF = async (req, res) => {
  try {
    const { obraId } = req.params;
    const { tipo, fechaInicio, fechaFin } = req.query;

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

    // 🔍 Obtener datos de asistencias y nombre de la obra para el Header
    const [asistenciasRes, obraRes] = await Promise.all([
      pool.query(`
        SELECT 
          a.fecha,
          t.nombre,
          a.estado,
          a.horas_trabajadas,
          a.horas_extra
        FROM asistencias a
        JOIN trabajadores t ON t.id = a.trabajador_id
        WHERE a.obra_id = $1
        AND a.fecha BETWEEN $2 AND $3
        ORDER BY a.fecha ASC, t.nombre ASC
      `, [obraId, start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")]),
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
      doc.text("FECHA", 50, tableHeaderY + 7, { width: 65 });
      doc.text("TRABAJADOR", 125, tableHeaderY + 7, { width: 195 });
      doc.text("ESTADO", 330, tableHeaderY + 7, { width: 80, align: "center" });
      doc.text("HRS TRAB.", 420, tableHeaderY + 7, { width: 60, align: "center" });
      doc.text("HRS EXTRA", 490, tableHeaderY + 7, { width: 60, align: "center" });
      
      // Restablecer posición base de renderizado de filas
      doc.y = tableHeaderY + 22;
    };

    // Pintar primer encabezado
    pintarHeaderPersonalizado();

    // --- RENDERIZADO DE FILAS DINÁMICAS ---
    let index = 0;
    
    asistenciasRes.rows.forEach(r => {
      // Verificar espacio en página antes de pintar (Filas toman 20 unidades de alto)
      if (doc.y > 740) {
        doc.addPage();
        pintarHeaderPersonalizado();
      }

      const currentY = doc.y;

      // Fondo alternado (efecto cebra)
      if (index % 2 === 1) {
        doc.rect(40, currentY, 515, 20).fill(COLOR_ROW_ALT);
      }

      // Línea de división entre registros
      doc.moveTo(40, currentY + 20).lineTo(555, currentY + 20).lineWidth(0.5).strokeColor("#F1F5F9").stroke();

      // Contenido de texto
      doc.fillColor(COLOR_TEXT).font("Helvetica").fontSize(8.5);
      
      // Fecha
      doc.text(dayjs(r.fecha).format("DD/MM/YYYY"), 50, currentY + 6, { width: 65 });
      
      // Nombre Completo
      doc.font("Helvetica-Bold").fillColor(COLOR_PRIMARY);
      doc.text(r.nombre.toUpperCase(), 125, currentY + 6, { width: 195, ellipsis: true });

      // Estado con color condicional lógico
      const estadoNormalizado = (r.estado || "").toLowerCase().trim();
      if (estadoNormalizado === "falta" || estadoNormalizado === "retardo") {
        doc.fillColor(COLOR_ACCENT).font("Helvetica-Bold");
      } else if (estadoNormalizado === "asistencia") {
        doc.fillColor("#16A34A").font("Helvetica-Bold"); // Verde 600
      } else {
        doc.fillColor(COLOR_MUTED).font("Helvetica");
      }
      doc.text(r.estado.toUpperCase(), 330, currentY + 6, { width: 80, align: "center" });

      // Métricas de tiempo
      doc.fillColor(COLOR_TEXT).font("Helvetica");
      doc.text(r.horas_trabajadas || "0", 420, currentY + 6, { width: 60, align: "center" });
      doc.text(r.horas_extra || "0", 490, currentY + 6, { width: 60, align: "center" });

      doc.y = currentY + 20;
      index++;
    });

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