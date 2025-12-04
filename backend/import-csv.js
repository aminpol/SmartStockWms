const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Conectar a PostgreSQL en Render
const pool = new Pool({
  connectionString:
    "postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a.oregon-postgres.render.com/smartstockwms",
  ssl: { rejectUnauthorized: false },
});

async function importCsv() {
  console.log("🚀 Iniciando importación desde CSV...\n");

  const client = await pool.connect();

  try {
    const csvPath = path.join(__dirname, "Materiales.csv");

    if (!fs.existsSync(csvPath)) {
      throw new Error(
        "No se encontró el archivo Materiales.csv en la carpeta backend"
      );
    }

    const content = fs.readFileSync(csvPath, "utf8");
    const lines = content.split("\n");

    console.log(`📄 Archivo leído: ${lines.length} líneas`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    // Empezar desde 1 para saltar el encabezado
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Separar por punto y coma
      const parts = line.split(";");

      if (parts.length < 3) {
        console.warn(`⚠️ Línea ${i + 1} inválida: ${line}`);
        skipCount++;
        continue;
      }

      const code = parts[0].trim();
      const description = parts[1].trim();
      const unit = parts[2].trim();
      const type = parts[3] ? parts[3].trim() : null;

      try {
        await client.query(
          `INSERT INTO materiales (id_code, description, unit, type) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id_code) 
           DO UPDATE SET description = EXCLUDED.description, unit = EXCLUDED.unit, type = EXCLUDED.type`,
          [code, description, unit, type]
        );
        successCount++;
        if (successCount % 50 === 0) process.stdout.write(".");
      } catch (err) {
        console.error(`\n❌ Error en línea ${i + 1} (${code}): ${err.message}`);
        errorCount++;
      }
    }

    // Contar total final
    const res = await client.query("SELECT COUNT(*) FROM materiales");
    const total = res.rows[0].count;

    console.log(`\n\n✅ Importación finalizada.`);
    console.log(`✨ Importados/Actualizados: ${successCount}`);
    console.log(`⚠️ Saltados: ${skipCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total en base de datos: ${total}`);
  } catch (error) {
    console.error("❌ Error general:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

importCsv();
