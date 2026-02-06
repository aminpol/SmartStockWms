const fs = require("fs");
const path = require("path");
const db = require("./db");

async function runRecreate() {
  const sqlPath = path.join(__dirname, "recreate_db.sql");

  if (!fs.existsSync(sqlPath)) {
    console.error("❌ No se encontró el archivo recreate_db.sql");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log(
    "🚀 Iniciando ejecución de scripts SQL en la nueva base de datos..."
  );

  try {
    // En PostgreSQL, podemos ejecutar múltiples comandos separados por punto y coma
    // Sin embargo, pg-pool (db.js) podría preferir comandos individuales o usar el pool directamente
    // Ejecutamos el block entero
    await db.query(sql);

    console.log("✅ ¡Tablas creadas y datos iniciales insertados con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar el script SQL:");
    console.error(error.message);
    process.exit(1);
  }
}

runRecreate();
