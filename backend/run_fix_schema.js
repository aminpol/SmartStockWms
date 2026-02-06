const fs = require("fs");
const path = require("path");
const db = require("./db");

async function runFix() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "fix_schema_lotes.sql"),
      "utf8"
    );
    console.log("🚀 Aplicando cambios de esquema para lotes e historial...");
    await db.query(sql);
    console.log("✅ Esquema actualizado correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error actualizando esquema:", error);
    process.exit(1);
  }
}

runFix();
