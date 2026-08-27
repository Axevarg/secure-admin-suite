import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const sourceConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const inventoryDatabase = process.env.INVENTORY_DB_NAME || "inventario";
const inventoryUser = process.env.INVENTORY_DB_USER || sourceConfig.user;
const inventoryPassword = process.env.INVENTORY_DB_PASSWORD || sourceConfig.password;
const client = new Client(sourceConfig);

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;

try {
  await client.connect();
  const available = await client.query(
    "SELECT name FROM pg_available_extensions WHERE name IN ('postgres_fdw', 'pg_cron')",
  );
  if (!available.rows.some((row) => row.name === "postgres_fdw")) {
    throw new Error("La instalación de PostgreSQL no incluye postgres_fdw");
  }

  await client.query("BEGIN");
  await client.query("CREATE EXTENSION IF NOT EXISTS postgres_fdw");
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'inventarios_server') THEN
        CREATE SERVER inventarios_server FOREIGN DATA WRAPPER postgres_fdw
          OPTIONS (host ${literal(sourceConfig.host)}, port ${literal(sourceConfig.port)}, dbname ${literal(inventoryDatabase)});
      END IF;
    END $$;
  `);
  await client.query(`ALTER SERVER inventarios_server OPTIONS (SET host ${literal(sourceConfig.host)}, SET port ${literal(sourceConfig.port)}, SET dbname ${literal(inventoryDatabase)})`);
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings m
        JOIN pg_foreign_server s ON s.oid = m.srvid
        WHERE s.srvname = 'inventarios_server' AND m.usename = CURRENT_USER
      ) THEN
        CREATE USER MAPPING FOR CURRENT_USER SERVER inventarios_server
          OPTIONS (user ${literal(inventoryUser)}, password ${literal(inventoryPassword)});
      END IF;
    END $$;
  `);
  await client.query(`ALTER USER MAPPING FOR CURRENT_USER SERVER inventarios_server OPTIONS (SET user ${literal(inventoryUser)}, SET password ${literal(inventoryPassword)})`);
  await client.query(`
    CREATE FOREIGN TABLE IF NOT EXISTS inventarios_colaboradores_sync (
      sigo_id VARCHAR(100),
      numero_empleado VARCHAR(30),
      nombre_completo VARCHAR(250),
      correo VARCHAR(250),
      estatus VARCHAR(30),
      sincronizado_en TIMESTAMPTZ
    ) SERVER inventarios_server OPTIONS (schema_name 'public', table_name 'colaboradores_inventario')
  `);
  await client.query(`
    CREATE OR REPLACE FUNCTION sincronizar_colaborador_inventarios()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    DECLARE nombre_final TEXT;
    BEGIN
      nombre_final := CONCAT_WS(' ', NEW.nombre, NEW.apellido_paterno, NEW.apellido_materno);
      UPDATE inventarios_colaboradores_sync SET
        sigo_id = NEW.id, nombre_completo = nombre_final, correo = NEW.email,
        estatus = NEW.estatus, sincronizado_en = CURRENT_TIMESTAMP
      WHERE numero_empleado = NEW.numero_empleado;
      IF NOT FOUND THEN
        INSERT INTO inventarios_colaboradores_sync
          (sigo_id, numero_empleado, nombre_completo, correo, estatus, sincronizado_en)
        VALUES
          (NEW.id, NEW.numero_empleado, nombre_final, NEW.email, NEW.estatus, CURRENT_TIMESTAMP);
      END IF;
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'No se pudo sincronizar colaborador %: %', NEW.numero_empleado, SQLERRM;
      RETURN NEW;
    END $$
  `);
  await client.query("DROP TRIGGER IF EXISTS trg_sincronizar_colaborador_inventarios ON colaboradores");
  await client.query(`
    CREATE TRIGGER trg_sincronizar_colaborador_inventarios
    AFTER INSERT OR UPDATE OF nombre, apellido_paterno, apellido_materno, email, estatus
    ON colaboradores FOR EACH ROW EXECUTE FUNCTION sincronizar_colaborador_inventarios()
  `);

  const collaborators = await client.query("SELECT * FROM colaboradores ORDER BY numero_empleado");
  for (const collaborator of collaborators.rows) {
    const name = [collaborator.nombre, collaborator.apellido_paterno, collaborator.apellido_materno].filter(Boolean).join(" ");
    const updated = await client.query(
      `UPDATE inventarios_colaboradores_sync SET sigo_id=$1, nombre_completo=$3, correo=$4, estatus=$5, sincronizado_en=CURRENT_TIMESTAMP WHERE numero_empleado=$2`,
      [collaborator.id, collaborator.numero_empleado, name, collaborator.email, collaborator.estatus],
    );
    if (!updated.rowCount) {
      await client.query(
        `INSERT INTO inventarios_colaboradores_sync (sigo_id,numero_empleado,nombre_completo,correo,estatus,sincronizado_en) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)`,
        [collaborator.id, collaborator.numero_empleado, name, collaborator.email, collaborator.estatus],
      );
    }
  }
  await client.query("COMMIT");
  console.log(`Sincronización PostgreSQL instalada. ${collaborators.rowCount} colaboradores conciliados.`);
  console.log(`pg_cron disponible: ${available.rows.some((row) => row.name === "pg_cron") ? "sí" : "no"}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("No se pudo instalar la sincronización:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
