import { pool } from "../config/db.js";
import multer from "multer";
import fs from "fs";

// ── STORAGE ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/colaboradores";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname.replace(/\s/g, "_")
    );
  },
});

export const upload = multer({ storage });

// ── GET TODOS ────────────────────────────────────────────
export const getColaboradores = async (req, res) => {
  try {
    const { estatus, departamento_id, q } = req.query;

    let where = ["1=1"];
    const params = [];
    let i = 1;

    if (estatus) {
      where.push(`c.estatus = $${i++}`);
      params.push(estatus);
    }

    if (departamento_id) {
      where.push(`c.departamento_id = $${i++}`);
      params.push(departamento_id);
    }

    if (q) {
      where.push(`
        (
          c.nombre ILIKE $${i}
          OR c.apellido_paterno ILIKE $${i}
          OR c.curp ILIKE $${i}
        )
      `);

      params.push(`%${q}%`);
      i++;
    }

    const { rows } = await pool.query(`
      SELECT
        c.*,
        d.nombre AS departamento,
        p.nombre AS puesto,
        COUNT(doc.id) AS num_documentos
      FROM colaboradores c
      LEFT JOIN departamentos d
        ON d.id = c.departamento_id
      LEFT JOIN puestos p
        ON p.id = c.puesto_id
      LEFT JOIN documentos_colaborador doc
        ON doc.colaborador_id = c.id
      WHERE ${where.join(" AND ")}
      GROUP BY c.id, d.nombre, p.nombre
      ORDER BY c.created_at DESC
    `, params);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Error al obtener colaboradores",
    });
  }
};

// ── GET UNO ──────────────────────────────────────────────
export const getColaborador = async (req, res) => {
  try {
    const { id } = req.params;

    const colaborador = await pool.query(`
      SELECT
        c.*,
        d.nombre AS departamento,
        p.nombre AS puesto
      FROM colaboradores c
      LEFT JOIN departamentos d
        ON d.id = c.departamento_id
      LEFT JOIN puestos p
        ON p.id = c.puesto_id
      WHERE c.id = $1
    `, [id]);

    if (!colaborador.rows.length) {
      return res.status(404).json({
        msg: "No encontrado",
      });
    }

    const horarios = await pool.query(`
      SELECT
        id,
        dia_semana,
        hora_entrada,
        hora_salida
      FROM colaboradores_horarios
      WHERE colaborador_id = $1
      ORDER BY
        CASE dia_semana
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          WHEN 'domingo' THEN 7
        END
    `, [id]);

    const docs = await pool.query(`
      SELECT *
      FROM documentos_colaborador
      WHERE colaborador_id = $1
      ORDER BY created_at DESC
    `, [id]);

    const historial = await pool.query(`
      SELECT
        h.*,
        u.name AS registrado_por_nombre
      FROM historial_laboral h
      LEFT JOIN users u
        ON u.id = h.registrado_por
      WHERE h.colaborador_id = $1
      ORDER BY h.fecha_cambio DESC
    `, [id]);

    res.json({
      colaborador: colaborador.rows[0],
      horarios: horarios.rows,
      documentos: docs.rows,
      historial: historial.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error",
    });
  }
};

// ── CREAR ────────────────────────────────────────────────
export const crearColaborador = async (req, res) => {
  try {

    const {
      nombre,
      apellido_paterno,
      apellido_materno,

      fecha_nacimiento,
      sexo,
      estado_civil,

      curp,
      rfc,
      nss,
      telefono,
      email,
      direccion,

      departamento_id,
      puesto_id,
      fecha_ingreso,

      tipo_contrato,
      turno,

      salario_diario,
      forma_pago,
      banco,
      clabe,
      numero_cuenta,

      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      contacto_emergencia_relacion,

      usuario_id,

      horarios,
    } = req.body;

    const foto_url = req.file
      ? `/uploads/colaboradores/${req.file.filename}`
      : null;

    const { rows } = await pool.query(`
      INSERT INTO colaboradores (
        nombre,
        apellido_paterno,
        apellido_materno,

        fecha_nacimiento,
        sexo,
        estado_civil,

        curp,
        rfc,
        nss,
        telefono,
        email,
        direccion,

        departamento_id,
        puesto_id,
        fecha_ingreso,

        tipo_contrato,
        turno,

        salario_diario,
        forma_pago,
        banco,
        clabe,
        numero_cuenta,

        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        contacto_emergencia_relacion,

        foto_url,
        created_by
      )
      VALUES (
        $1,$2,$3,
        $4,$5,$6,
        $7,$8,$9,$10,$11,$12,
        $13,$14,$15,
        $16,$17,
        $18,$19,$20,$21,$22,
        $23,$24,$25,
        $26,$27
      )
      RETURNING *
    `, [
      nombre,
      apellido_paterno,
      apellido_materno ?? null,

      fecha_nacimiento ?? null,
      sexo ?? null,
      estado_civil ?? null,

      curp ?? null,
      rfc ?? null,
      nss ?? null,
      telefono ?? null,
      email ?? null,
      direccion ?? null,

      departamento_id ?? null,
      puesto_id ?? null,
      fecha_ingreso ?? new Date().toISOString().split("T")[0],

      tipo_contrato ?? null,
      turno ?? null,

      salario_diario ?? null,
      forma_pago ?? null,
      banco ?? null,
      clabe ?? null,
      numero_cuenta ?? null,

      contacto_emergencia_nombre ?? null,
      contacto_emergencia_telefono ?? null,
      contacto_emergencia_relacion ?? null,

      foto_url,
      usuario_id ?? null,
    ]);

    const colaborador = rows[0];

    // ── HORARIOS ─────────────────────────────
    if (horarios) {

      const horariosParseados =
        typeof horarios === "string"
          ? JSON.parse(horarios)
          : horarios;

      for (const h of horariosParseados) {

        await pool.query(`
          INSERT INTO colaboradores_horarios (
            colaborador_id,
            dia_semana,
            hora_entrada,
            hora_salida
          )
          VALUES ($1,$2,$3,$4)
        `, [
          colaborador.id,
          h.dia_semana,
          h.hora_entrada,
          h.hora_salida,
        ]);
      }
    }

    res.json(colaborador);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error al crear colaborador",
    });
  }
};

// ── EDITAR ───────────────────────────────────────────────
export const editarColaborador = async (req, res) => {
  try {

    const { id } = req.params;

    const fields = req.body;

    // ── FOTO ────────────────────────────────
    if (req.file) {
      fields.foto_url =
        `/uploads/colaboradores/${req.file.filename}`;
    }

    // ── HORARIOS ────────────────────────────
    const horarios = fields.horarios
      ? (
          typeof fields.horarios === "string"
            ? JSON.parse(fields.horarios)
            : fields.horarios
        )
      : null;

    delete fields.horarios;

    fields.updated_at = new Date();

    const keys = Object.keys(fields)
      .filter(k => k !== "usuario_id");

    const values = keys.map(k => fields[k]);

    const setClause = keys
      .map((k, i) => `${k} = $${i + 1}`)
      .join(", ");

    const { rows } = await pool.query(`
      UPDATE colaboradores
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [
      ...values,
      id,
    ]);

    // ── ACTUALIZAR HORARIOS ─────────────────
    if (horarios) {

      await pool.query(`
        DELETE FROM colaboradores_horarios
        WHERE colaborador_id = $1
      `, [id]);

      for (const h of horarios) {

        await pool.query(`
          INSERT INTO colaboradores_horarios (
            colaborador_id,
            dia_semana,
            hora_entrada,
            hora_salida
          )
          VALUES ($1,$2,$3,$4)
        `, [
          id,
          h.dia_semana,
          h.hora_entrada,
          h.hora_salida,
        ]);
      }
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error al editar",
    });
  }
};

// ── CAMBIAR ESTATUS ──────────────────────────────────────
export const cambiarEstatus = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      estatus,
      motivo,
      usuario_id,
    } = req.body;

    const prev = await pool.query(`
      SELECT estatus
      FROM colaboradores
      WHERE id = $1
    `, [id]);

    if (!prev.rows.length) {
      return res.status(404).json({
        msg: "No encontrado",
      });
    }

    await pool.query(`
      UPDATE colaboradores
      SET
        estatus = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [
      estatus,
      id,
    ]);

    await pool.query(`
      INSERT INTO historial_laboral (
        colaborador_id,
        tipo_cambio,
        descripcion,
        valor_anterior,
        valor_nuevo,
        registrado_por
      )
      VALUES (
        $1,
        'cambio_estatus',
        $2,
        $3,
        $4,
        $5
      )
    `, [
      id,
      motivo ?? null,
      prev.rows[0].estatus,
      estatus,
      usuario_id ?? null,
    ]);

    res.json({
      msg: "Estatus actualizado",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error",
    });
  }
};

// ── DOCUMENTOS ───────────────────────────────────────────
export const subirDocumento = async (req, res) => {
  try {

    const {
      colaborador_id,
      tipo,
      fecha_vencimiento,
      usuario_id,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        msg: "Archivo requerido",
      });
    }

    const url =
      `/uploads/colaboradores/${req.file.filename}`;

const { rows } = await pool.query(`
  INSERT INTO documentos_colaborador (
    colaborador_id,
    tipo,
    nombre_archivo,
    url,
    fecha_vencimiento,
    uploaded_by
  )
  VALUES ($1,$2,$3,$4,$5,$6)
  RETURNING *
`, [
  colaborador_id,
  tipo,
  req.file.originalname,
  url,
  fecha_vencimiento ?? null,
  usuario_id && usuario_id.trim() !== ""
    ? usuario_id
    : null,
]);

    res.json(rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error al subir documento",
    });
  }
};

// ── ELIMINAR DOCUMENTO ───────────────────────────────────
export const eliminarDocumento = async (req, res) => {
  try {

    const { id } = req.params;

    const doc = await pool.query(`
      SELECT url
      FROM documentos_colaborador
      WHERE id = $1
    `, [id]);

    if (!doc.rows.length) {
      return res.status(404).json({
        msg: "No existe",
      });
    }

    const path = "." + doc.rows[0].url;

    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }

    await pool.query(`
      DELETE FROM documentos_colaborador
      WHERE id = $1
    `, [id]);

    res.json({
      msg: "Eliminado",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error",
    });
  }
};

// ── CATÁLOGOS ────────────────────────────────────────────
export const getDepartamentos = async (_req, res) => {

  const { rows } = await pool.query(`
    SELECT *
    FROM departamentos
    ORDER BY nombre
  `);

  res.json(rows);
};

export const getPuestos = async (req, res) => {

  const { departamento_id } = req.query;

  const q = departamento_id
    ? `
      SELECT *
      FROM puestos
      WHERE departamento_id = $1
      ORDER BY nombre
    `
    : `
      SELECT *
      FROM puestos
      ORDER BY nombre
    `;

  const { rows } = await pool.query(
    q,
    departamento_id
      ? [departamento_id]
      : []
  );

  res.json(rows);
};

export const crearPuesto = async (req, res) => {

  const {
    nombre,
    departamento_id,
  } = req.body;

  const { rows } = await pool.query(`
    INSERT INTO puestos (
      nombre,
      departamento_id
    )
    VALUES ($1,$2)
    RETURNING *
  `, [
    nombre,
    departamento_id ?? null,
  ]);

  res.json(rows[0]);
};

// ── ASIGNACIONES DE OBRA ─────────────────────────────────

// GET asignación activa + historial del colaborador
export const getAsignaciones = async (req, res) => {
  try {
    const { colaboradorId } = req.params;

    const { rows } = await pool.query(`
      SELECT
        a.*,
        o.nombre AS obra_nombre,
        o.ubicacion AS obra_ubicacion,
        u.name AS asignado_por_nombre
      FROM asignaciones_obra a
      LEFT JOIN obras o ON o.id = a.obra_id
      LEFT JOIN users u ON u.id = a.asignado_por
      WHERE a.colaborador_id = $1
      ORDER BY a.es_activa DESC, a.fecha_inicio DESC
    `, [colaboradorId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener asignaciones" });
  }
};

// POST asignar a obra (cierra la activa anterior automáticamente)
export const asignarObra = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { colaboradorId } = req.params;
    const { obra_id, fecha_inicio, porcentaje_dedicacion, notas, usuario_id } = req.body;

    // Cerrar asignación activa anterior
    await client.query(`
      UPDATE asignaciones_obra
      SET es_activa = FALSE,
          fecha_fin = $1
      WHERE colaborador_id = $2
        AND es_activa = TRUE
    `, [fecha_inicio ?? new Date().toISOString().split("T")[0], colaboradorId]);

    // Crear nueva asignación
    const { rows } = await client.query(`
      INSERT INTO asignaciones_obra
        (colaborador_id, obra_id, fecha_inicio, porcentaje_dedicacion, notas, asignado_por)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      colaboradorId,
      obra_id,
      fecha_inicio ?? new Date().toISOString().split("T")[0],
      porcentaje_dedicacion ?? 100,
      notas ?? null,
      usuario_id ?? null,
    ]);

    // Registrar en historial laboral
    await client.query(`
      INSERT INTO historial_laboral
        (colaborador_id, tipo_cambio, descripcion, registrado_por)
      VALUES ($1, 'cambio_obra', $2, $3)
    `, [
      colaboradorId,
      notas ?? "Reasignación de obra",
      usuario_id ?? null,
    ]);

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al asignar obra" });
  } finally {
    client.release();
  }
};

// DELETE / desasignar (sin nueva obra, queda sin asignación)
export const desasignarObra = async (req, res) => {
  try {
    const { colaboradorId } = req.params;
    const { usuario_id } = req.body;

    await pool.query(`
      UPDATE asignaciones_obra
      SET es_activa = FALSE,
          fecha_fin = CURRENT_DATE
      WHERE colaborador_id = $1 AND es_activa = TRUE
    `, [colaboradorId]);

    await pool.query(`
      INSERT INTO historial_laboral
        (colaborador_id, tipo_cambio, descripcion, registrado_por)
      VALUES ($1, 'desasignacion_obra', 'Colaborador sin obra asignada', $2)
    `, [colaboradorId, usuario_id ?? null]);

    res.json({ msg: "Desasignado correctamente" });
  } catch (err) {
    res.status(500).json({ msg: "Error al desasignar" });
  }
};


// ── CUMPLEAÑOS ───────────────────────────────────────────
export const getCumpleanios = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.nombre,
        c.apellido_paterno,
        c.apellido_materno,
        c.fecha_nacimiento,
        c.foto_url,
        c.estatus,
        c.telefono,
        d.nombre AS departamento,
        p.nombre AS puesto
      FROM colaboradores c
      LEFT JOIN departamentos d ON d.id = c.departamento_id
      LEFT JOIN puestos p ON p.id = c.puesto_id
      WHERE c.fecha_nacimiento IS NOT NULL
        AND c.estatus != 'baja'
      ORDER BY c.nombre
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const conCalculo = rows.map((c) => {
      const nacimiento = new Date(c.fecha_nacimiento);
      const mes = nacimiento.getUTCMonth();
      const dia = nacimiento.getUTCDate();

      let proximo = new Date(hoy.getFullYear(), mes, dia);
      if (proximo < hoy) {
        proximo = new Date(hoy.getFullYear() + 1, mes, dia);
      }

      const diasFaltantes = Math.round(
        (proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      const edadActual = hoy.getFullYear() - nacimiento.getUTCFullYear();
      const edadCumple = proximo.getFullYear() - nacimiento.getUTCFullYear();

      return {
        ...c,
        dia,
        mes: mes + 1,
        dias_faltantes: diasFaltantes,
        es_hoy: diasFaltantes === 0,
        edad_actual: edadActual,
        edad_cumple: edadCumple,
      };
    });

    conCalculo.sort((a, b) => a.dias_faltantes - b.dias_faltantes);

    res.json(conCalculo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener cumpleaños" });
  }
};