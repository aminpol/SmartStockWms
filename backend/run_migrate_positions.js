const fs = require("fs");
const path = require("path");
const db = require("./db");

async function migratePositions() {
  const sqlPath = path.join(__dirname, "migrate_data.sql");

  if (!fs.existsSync(sqlPath)) {
    console.error("❌ No se encontró el archivo migrate_data.sql");
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  console.log(
    "🚀 Iniciando migración de posiciones y ubicaciones a Neon.tech..."
  );

  try {
    // Ejecutamos el archivo SQL completo
    // Nota: El archivo contiene múltiples bloques INSERT y ON CONFLICT que pg-pool puede manejar
    await db.query(sqlContent);

    console.log("✅ ¡Posiciones y ubicaciones migradas con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al migrar posiciones:");
    console.error(error.message);
    process.exit(1);
  }
}

migratePositions();
