const db = require("./db");

async function addEstadoColumn() {
  try {
    console.log("Agregando columna Estado a historial_movimientos...");

    await db.query(`
      ALTER TABLE historial_movimientos 
      ADD COLUMN Estado VARCHAR(100) AFTER T_movimi
    `);

    console.log("✓ Columna Estado agregada exitosamente");
    process.exit(0);
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("✓ La columna Estado ya existe");
      process.exit(0);
    }
    console.error("✗ Error agregando columna:", error.message);
    process.exit(1);
  }
}

addEstadoColumn();
