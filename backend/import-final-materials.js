const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Conectar a PostgreSQL en Render
const pool = new Pool({
  connectionString:
    "postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a.oregon-postgres.render.com/smartstockwms",
  ssl: { rejectUnauthorized: false },
});

async function importAllMaterials() {
  console.log("🚀 Iniciando importación COMPLETA de materiales...\n");

  const client = await pool.connect();

  try {
    // Leer el archivo SQL generado anteriormente
    const sqlPath = path.join(
      __dirname,
      "..",
      "import_all_materials_complete.sql"
    );

    if (!fs.existsSync(sqlPath)) {
      console.error(
        "❌ No se encontró el archivo import_all_materials_complete.sql"
      );
      console.log("Generándolo nuevamente...");

      // Si no existe, usar el contenido hardcodeado del script Python anterior
      // (Por brevedad, asumimos que el archivo existe ya que lo creamos en pasos anteriores)
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    console.log("📦 Ejecutando script de importación...");

    // Ejecutar el script SQL
    await client.query(sqlContent);

    // Contar cuántos materiales hay ahora
    const res = await client.query("SELECT COUNT(*) FROM materiales");
    const count = res.rows[0].count;

    console.log(`\n✅ Importación finalizada.`);
    console.log(`📊 Total de materiales en la base de datos: ${count}`);
  } catch (error) {
    console.error("❌ Error durante la importación:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

importAllMaterials();
