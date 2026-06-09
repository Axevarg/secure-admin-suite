import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

// ── PERÍODOS ─────────────────────────────────────────────

export const getPeriodos = async (req, res) => {
  try {
    const { estado, obra_id } = req.query;
    let where = ["1=1"];
    const params = [];
    let i = 1;

    if (estado) {
      where.push(`p.estado=$${i++}`);
      params.push(estado);
    }
    if (obra_id) {
      where.push(`p.obra_id=$${i++}`);
      params.push(obra_id);
    }

    const { rows } = await pool.query(
      `
      SELECT
        p.*,
        o.nombre  AS obra_nombre,
        cb.nombre AS cuenta_nombre,
        u.name    AS creado_por_nombre,
        COUNT(nd.id) AS total_colaboradores
      FROM nomina_periodos p
      LEFT JOIN obras o              ON o.id  = p.obra_id
      LEFT JOIN cuentas_bancarias cb ON cb.id = p.cuenta_bancaria_id
      LEFT JOIN users u              ON u.id  = p.creado_por
      LEFT JOIN nomina_detalle nd    ON nd.periodo_id = p.id
      WHERE ${where.join(" AND ")}
      GROUP BY p.id, o.nombre, cb.nombre, u.name
      ORDER BY p.fecha_inicio DESC
    `,
      params,
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener períodos" });
  }
};

export const getPeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    const periodo = await pool.query(
      `
      SELECT p.*, o.nombre AS obra_nombre, cb.nombre AS cuenta_nombre
      FROM nomina_periodos p
      LEFT JOIN obras o              ON o.id  = p.obra_id
      LEFT JOIN cuentas_bancarias cb ON cb.id = p.cuenta_bancaria_id
      WHERE p.id = $1
    `,
      [id],
    );

    if (!periodo.rows.length)
      return res.status(404).json({ msg: "Período no encontrado" });

    const detalles = await pool.query(
      `
      SELECT
        nd.*,
        c.nombre        AS colaborador_nombre,
        c.apellido_paterno,
        c.apellido_materno,
        c.foto_url,
        c.banco,
        c.clabe,
        c.numero_cuenta,
        c.forma_pago,
        o.nombre        AS obra_nombre,
        p.nombre        AS puesto_nombre,
        d.nombre        AS departamento_nombre
      FROM nomina_detalle nd
      LEFT JOIN colaboradores c    ON c.id  = nd.colaborador_id
      LEFT JOIN obras o            ON o.id  = nd.obra_id
      LEFT JOIN puestos p          ON p.id  = c.puesto_id
      LEFT JOIN departamentos d    ON d.id  = c.departamento_id
      WHERE nd.periodo_id = $1
      ORDER BY c.apellido_paterno, c.nombre
    `,
      [id],
    );

    res.json({
      periodo: periodo.rows[0],
      detalles: detalles.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error" });
  }
};

export const crearPeriodo = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      nombre,
      tipo,
      fecha_inicio,
      fecha_fin,
      obra_id,
      cuenta_bancaria_id,
      usuario_id,
    } = req.body;

    // Calcular días del período
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    const diasPeriodo = Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

    // Crear período
    const {
      rows: [periodo],
    } = await client.query(
      `
      INSERT INTO nomina_periodos
        (nombre, tipo, fecha_inicio, fecha_fin, obra_id, cuenta_bancaria_id, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
      [
        nombre ?? `Nómina ${tipo} ${fecha_inicio}`,
        tipo,
        fecha_inicio,
        fecha_fin,
        obra_id ?? null,
        cuenta_bancaria_id ?? null,
        usuario_id ?? null,
      ],
    );

    // Obtener colaboradores activos (filtrar por obra si se especificó)
    let queryColabs = `
      SELECT DISTINCT
        c.id, c.salario_diario, a.obra_id
      FROM colaboradores c
      LEFT JOIN asignaciones_obra a ON a.colaborador_id = c.id AND a.es_activa = TRUE
      WHERE c.estatus = 'activo'
        AND c.salario_diario IS NOT NULL
    `;
    const colabParams = [];
    if (obra_id) {
      queryColabs += ` AND a.obra_id = $1`;
      colabParams.push(obra_id);
    }

    const { rows: colaboradores } = await client.query(
      queryColabs,
      colabParams,
    );

    // Generar detalle por colaborador
    for (const c of colaboradores) {
      const salarioBase = Number(c.salario_diario) * diasPeriodo;

      await client.query(
        `
        INSERT INTO nomina_detalle
          (periodo_id, colaborador_id, obra_id, salario_diario, dias_periodo,
           dias_trabajados, salario_base, total_percepciones,
           total_deducciones, neto_pagar)
        VALUES ($1,$2,$3,$4,$5,$5,$6,$6,0,$6)
      `,
        [
          periodo.id,
          c.id,
          c.obra_id ?? obra_id ?? null,
          c.salario_diario,
          diasPeriodo,
          salarioBase,
        ],
      );
    }

    // Actualizar totales del período
    await recalcularTotalesPeriodo(client, periodo.id);

    await client.query("COMMIT");
    res.json(periodo);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al crear período" });
  } finally {
    client.release();
  }
};

// ── DETALLE ──────────────────────────────────────────────

export const actualizarDetalle = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      dias_trabajados,
      horas_extra,
      bonos,
      otros_ingresos,
      faltas,
      deducciones_imss,
      otras_deducciones,
      observaciones,
    } = req.body;

    // Obtener datos base
    const {
      rows: [det],
    } = await client.query("SELECT * FROM nomina_detalle WHERE id=$1", [id]);
    if (!det) return res.status(404).json({ msg: "No encontrado" });

    // Recalcular
    const diasTrabajados = Number(dias_trabajados ?? det.dias_trabajados);
    const salarioBase = Number(det.salario_diario) * diasTrabajados;
    const precioHora = Number(det.salario_diario) / 8;
    const montoHorasExtra =
      Number(horas_extra ?? det.horas_extra) * precioHora * 2; // horas extra al doble
    const montoFaltas =
      Number(det.salario_diario) * Number(faltas ?? det.faltas);
    const totalPercepciones =
      salarioBase +
      montoHorasExtra +
      Number(bonos ?? det.bonos) +
      Number(otros_ingresos ?? det.otros_ingresos);
    const totalDeducciones =
      montoFaltas +
      Number(deducciones_imss ?? det.deducciones_imss) +
      Number(otras_deducciones ?? det.otras_deducciones);
    const netoPagar = totalPercepciones - totalDeducciones;

    const {
      rows: [updated],
    } = await client.query(
      `
      UPDATE nomina_detalle SET
        dias_trabajados   = $1,
        salario_base      = $2,
        horas_extra       = $3,
        monto_horas_extra = $4,
        bonos             = $5,
        otros_ingresos    = $6,
        total_percepciones = $7,
        faltas            = $8,
        monto_faltas      = $9,
        deducciones_imss  = $10,
        otras_deducciones = $11,
        total_deducciones = $12,
        neto_pagar        = $13,
        observaciones     = $14,
        updated_at        = NOW()
      WHERE id = $15
      RETURNING *
    `,
      [
        diasTrabajados,
        salarioBase,
        horas_extra ?? det.horas_extra,
        montoHorasExtra,
        bonos ?? det.bonos,
        otros_ingresos ?? det.otros_ingresos,
        totalPercepciones,
        faltas ?? det.faltas,
        montoFaltas,
        deducciones_imss ?? det.deducciones_imss,
        otras_deducciones ?? det.otras_deducciones,
        totalDeducciones,
        netoPagar,
        observaciones ?? det.observaciones,
        id,
      ],
    );

    // Recalcular totales del período
    await recalcularTotalesPeriodo(client, det.periodo_id);

    await client.query("COMMIT");
    res.json(updated);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al actualizar detalle" });
  } finally {
    client.release();
  }
};

// ── CERRAR Y PAGAR ────────────────────────────────────────

export const cerrarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    const {
      rows: [p],
    } = await pool.query("SELECT * FROM nomina_periodos WHERE id=$1", [id]);
    if (!p) return res.status(404).json({ msg: "No encontrado" });
    if (p.estado !== "borrador" && p.estado !== "revision")
      return res
        .status(400)
        .json({ msg: "Solo se pueden cerrar períodos en borrador o revisión" });

    await pool.query(
      `
      UPDATE nomina_periodos
      SET estado='cerrada', cerrado_por=$1, updated_at=NOW()
      WHERE id=$2
    `,
      [usuario_id ?? null, id],
    );

    res.json({ msg: "Período cerrado" });
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};

export const pagarNomina = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const {
      rows: [p],
    } = await client.query(`SELECT * FROM nomina_periodos WHERE id = $1`, [id]);

    if (!p) {
      return res.status(404).json({
        msg: "No encontrado",
      });
    }

    if (p.estado !== "cerrada") {
      return res.status(400).json({
        msg: "El período debe estar cerrado antes de marcarse como pagado",
      });
    }

    // Marcar detalle como pagado
    await client.query(
      `
      UPDATE nomina_detalle
      SET
        estado_pago = 'pagado',
        fecha_pago = CURRENT_DATE
      WHERE periodo_id = $1
    `,
      [id],
    );

    // Marcar período como pagado
    await client.query(
      `
      UPDATE nomina_periodos
      SET
        estado = 'pagada',
        updated_at = NOW()
      WHERE id = $1
    `,
      [id],
    );

    await client.query("COMMIT");

    res.json({
      msg: "Nómina marcada como pagada",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    res.status(500).json({
      msg: "Error al pagar nómina",
    });
  } finally {
    client.release();
  }
};

// ── HELPER ────────────────────────────────────────────────

async function recalcularTotalesPeriodo(client, periodoId) {
  await client.query(
    `
    UPDATE nomina_periodos p SET
      total_bruto       = sub.bruto,
      total_deducciones = sub.deducciones,
      total_neto        = sub.neto,
      updated_at        = NOW()
    FROM (
      SELECT
        periodo_id,
        SUM(total_percepciones) AS bruto,
        SUM(total_deducciones)  AS deducciones,
        SUM(neto_pagar)         AS neto
      FROM nomina_detalle
      WHERE periodo_id = $1
      GROUP BY periodo_id
    ) sub
    WHERE p.id = sub.periodo_id
  `,
    [periodoId],
  );
}

// ── REPORTE BANCARIO ─────────────────────────────────────

export const getReporteBancario = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        c.banco,
        c.numero_cuenta,
        c.clabe,
        c.nombre,
        c.apellido_paterno,
        c.apellido_materno,
        nd.neto_pagar
      FROM nomina_detalle nd
      INNER JOIN colaboradores c
        ON c.id = nd.colaborador_id
      WHERE nd.periodo_id = $1
      ORDER BY
        c.banco,
        c.apellido_paterno,
        c.nombre
    `,
      [id],
    );

    const agrupado = rows.reduce((acc, row) => {
      const banco = row.banco || "SIN BANCO";

      if (!acc[banco]) {
        acc[banco] = [];
      }

      acc[banco].push({
        nombreCompleto: [row.nombre, row.apellido_paterno, row.apellido_materno]
          .filter(Boolean)
          .join(" "),
        numero_cuenta: row.numero_cuenta,
        clabe: row.clabe,
        neto_pagar: row.neto_pagar,
      });

      return acc;
    }, {});

    res.json(agrupado);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Error al generar reporte bancario",
    });
  }
};

// ── PDF DISPERSIÓN BANCARIA ─────────────────────────────

export const generarDispersionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { obra } = req.query; // ← recibe el filtro

    const periodoQuery = await pool.query(
      `
      SELECT
        id,
        nombre,
        fecha_inicio,
        fecha_fin,
        to_char(fecha_inicio, 'DD/MM/YYYY') as fecha_inicio_texto,
        to_char(fecha_fin, 'DD/MM/YYYY') as fecha_fin_texto
      FROM nomina_periodos
      WHERE id = $1
    `,
      [id],
    );

    if (!periodoQuery.rows.length) {
      return res.status(404).json({ msg: "Periodo no encontrado" });
    }
    const periodo = periodoQuery.rows[0];

    const fechaInicioFormato = dayjs(periodo.fecha_inicio).format(
      "DD-MMM-YYYY",
    );
    const fechaFinFormato = dayjs(periodo.fecha_fin).format("DD-MMM-YYYY");

        const nombreArchivo = obra
      ? `Dispersion_${fechaInicioFormato}_${obra.replace(/\s/g, "_")}.pdf`
      : `Dispersion_${fechaInicioFormato}_al_${fechaFinFormato}.pdf`;

    const { rows } = await pool.query(
      `SELECT
        COALESCE(NULLIF(TRIM(c.banco), ''), 'SIN BANCO') as banco,
        c.numero_cuenta, c.clabe,
        c.nombre, c.apellido_paterno, c.apellido_materno,
        nd.neto_pagar,
        o.nombre AS obra_nombre
      FROM nomina_detalle nd
      INNER JOIN colaboradores c ON c.id = nd.colaborador_id
      LEFT JOIN obras o ON o.id = nd.obra_id
      WHERE nd.periodo_id = $1
        ${obra ? `AND o.nombre ILIKE $2` : ""}
      ORDER BY c.banco, c.apellido_paterno, c.nombre`,
      obra ? [id, obra] : [id]
    );

    // Configuración de página A4 Horizontal (841.89 x 595.28 ptos)
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
      bufferPages: false, // Habilita numeración dinámica al final
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nombreArchivo}"`);
    doc.pipe(res);

    // Dimensiones de trabajo útiles
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2; // 761.89 ptos

    // Definición de anchos de columnas
    const colWidths = {
      idx: 30,
      nombre: 250,
      cuenta: 140,
      clabe: 180,
      neto: 120,
    };
    const colPositions = {
      idx: margin,
      nombre: margin + colWidths.idx,
      cuenta: margin + colWidths.idx + colWidths.nombre,
      clabe: margin + colWidths.idx + colWidths.nombre + colWidths.cuenta,
      neto:
        margin +
        colWidths.idx +
        colWidths.nombre +
        colWidths.cuenta +
        colWidths.clabe,
    };

    let totalGeneral = 0;

    // REPETIBLE: Renderizar Header de la Página
    const imprimirHeaderPagina = () => {
      // Bloque oscuro estético
      doc.rect(margin, margin, contentWidth, 65).fill("#0f172a");

      // Detalle rojo corporativo izquierdo
      doc.rect(margin, margin, 6, 65).fill("#dc2626");

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("SIGO ", margin + 20, margin + 15);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          "REPORTE DE DISPERSIÓN BANCARIA DE NÓMINA",
          margin + 20,
          margin + 35,
          { characterSpacing: 0.5 },
        );

      // Fechas en la esquina derecha del bloque
      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(9)
        .text(`PERIODO: ${periodo.nombre.toUpperCase()}`, margin, margin + 18, {
          align: "right",
          width: contentWidth - 20,
        })
        .text(
          `VIGENCIA: ${periodo.fecha_inicio_texto} AL ${periodo.fecha_fin_texto}`,
          margin,
          margin + 33,
          {
            align: "right",
            width: contentWidth - 20,
          },
        );

            if (obra) {
      doc
        .fillColor("#f59e0b")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(`OBRA: ${obra.toUpperCase()}`, margin, margin + 48, {
          align: "right",
          width: contentWidth - 20,
        });
    }

      doc.y = margin + 85;
    };

    // REPETIBLE: Renderizar Encabezado de la Tabla
    const imprimirEncabezadoTabla = (banco) => {
      // Título del Banco
      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(`INSTITUCIÓN BANCARIA: ${banco.toUpperCase()}`, margin, doc.y);

      doc.moveDown(0.4);

      const yHdr = doc.y;
      // Fondo gris para el encabezado de las columnas
      doc.rect(margin, yHdr, contentWidth, 20).fill("#f1f5f9");

      doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8);

      doc.text("#", colPositions.idx + 5, yHdr + 6, { width: colWidths.idx });
      doc.text("COLABORADOR / EMPLEADO", colPositions.nombre, yHdr + 6, {
        width: colWidths.nombre,
      });
      doc.text("NÚMERO DE CUENTA", colPositions.cuenta, yHdr + 6, {
        width: colWidths.cuenta,
      });
      doc.text("CLAVE INTERBANCARIA (CLABE)", colPositions.clabe, yHdr + 6, {
        width: colWidths.clabe,
      });
      doc.text("NETO A PAGAR", colPositions.neto, yHdr + 6, {
        width: colWidths.neto - 5,
        align: "right",
      });

      doc.y = yHdr + 25;
    };

    // REPETIBLE: Renderizar Cierre de sección por Banco
    const imprimirTotalBanco = (banco, total, cantidad) => {
      const yTotal = doc.y;

      doc.rect(margin, yTotal, contentWidth, 24).fill("#f8fafc");
      doc.rect(margin, yTotal, contentWidth, 1).fill("#cbd5e1");

      doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);

      doc.text(
        `Subtotal dispersión ${banco.toUpperCase()} (${cantidad} colaboradores)`,
        margin + 15,
        yTotal + 8,
      );

      doc
        .fillColor("#0f172a")
        .text(
          `$${Number(total).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`,
          colPositions.neto,
          yTotal + 8,
          { width: colWidths.neto - 5, align: "right" },
        );

      doc.y = yTotal + 35;
    };

    // Inicializar primera página
    imprimirHeaderPagina();

    let bancoActual = null;
    let totalBanco = 0;
    let cantidadBanco = 0;
    let filaIndex = 0;

    rows.forEach((r) => {
      // Detectar cambio de grupo bancario
      if (r.banco !== bancoActual) {
        if (bancoActual !== null) {
          // Validar espacio para el subtotal del banco anterior
          if (doc.y > pageHeight - 70) {
            doc.addPage();
            imprimirHeaderPagina();
          }
          imprimirTotalBanco(bancoActual, totalBanco, cantidadBanco);
        }

        bancoActual = r.banco;
        totalBanco = 0;
        cantidadBanco = 0;
        filaIndex = 0;

        // Validar espacio antes de iniciar un nuevo encabezado de banco
        if (doc.y > pageHeight - 100) {
          doc.addPage();
          imprimirHeaderPagina();
        }

        imprimirEncabezadoTabla(bancoActual);
      }

      cantidadBanco++;
      filaIndex++;
      const netoRow = Number(r.neto_pagar || 0);
      totalBanco += netoRow;
      totalGeneral += netoRow;

      const nombreCompleto =
        `${r.apellido_paterno || ""} ${r.apellido_materno || ""} ${r.nombre || ""}`
          .trim()
          .toUpperCase();

      // Control dinámico de salto de página por registro (Evita cortes raros)
      if (doc.y > pageHeight - 55) {
        doc.addPage();
        imprimirHeaderPagina();
        imprimirEncabezadoTabla(bancoActual);
      }

      const yRow = doc.y;

      // Renderizar fondo intercalado cebrado para legibilidad contable
      if (filaIndex % 2 === 0) {
        doc.rect(margin, yRow - 2, contentWidth, 16).fill("#f8fafc");
      }

      doc.fillColor("#334155").font("Helvetica").fontSize(8.5);

      doc.text(cantidadBanco.toString(), colPositions.idx + 5, yRow, {
        width: colWidths.idx,
      });
      doc.text(nombreCompleto, colPositions.nombre, yRow, {
        width: colWidths.nombre - 10,
        ellipsis: true,
      });
      doc.text(r.numero_cuenta || "—", colPositions.cuenta, yRow, {
        width: colWidths.cuenta,
      });
      doc.text(r.clabe || "—", colPositions.clabe, yRow, {
        width: colWidths.clabe,
      });

      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text(
          `$${netoRow.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          colPositions.neto,
          yRow,
          { width: colWidths.neto - 5, align: "right" },
        );

      doc.y = yRow + 16;
    });

    // Imprimir el bloque de totales del último banco procesado
    if (bancoActual !== null) {
      if (doc.y > pageHeight - 70) {
        doc.addPage();
        imprimirHeaderPagina();
      }
      imprimirTotalBanco(bancoActual, totalBanco, cantidadBanco);
    }

    // BLOQUE FINAL: Gran Total General Concentrado
    if (doc.y > pageHeight - 90) {
      doc.addPage();
      imprimirHeaderPagina();
    }

    doc.moveDown(1);
    const yGlobal = doc.y;

    // Caja destacada de Gran Total Estilo Dashboard
    doc.rect(margin, yGlobal, contentWidth, 40).fill("#0f172a");
    doc.rect(margin, yGlobal, 8, 40).fill("#dc2626"); // Acabado izquierdo rojo

    doc
      .fillColor("#94a3b8")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("MONTO TOTAL CONSOLIDADO A DISPERSAR", margin + 20, yGlobal + 15);

    doc
      .fillColor("#34d399") // Verde Éxito Intenso
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(
        `$${totalGeneral.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`,
        colPositions.neto - 150,
        yGlobal + 12,
        { width: colWidths.neto + 145, align: "right" },
      );

    // NUMERACIÓN DE PÁGINAS AUTOMÁTICA (Dos pasos de renderizado)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `PÁGINA ${i + 1} DE ${pages.count}`,
          margin,
          pageHeight - margin + 10,
          { align: "center", width: contentWidth },
        );
    }

    doc.end();
  } catch (err) {
    console.error("Error crítico PDF:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ msg: "Error interno al generar el reporte de dispersión" });
    }
  }
};
