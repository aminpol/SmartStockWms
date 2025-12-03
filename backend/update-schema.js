const db = require("./db");

async function updateSchema() {
  try {
    // Modificar la columna tipo_usuario para incluir 'administrador'
    await db.query(`
      ALTER TABLE usuarios 
      MODIFY COLUMN tipo_usuario ENUM('bodega', 'administrativo', 'administrador') NOT NULL
    `);
    console.log(
      "✓ Schema actualizado: 'administrador' agregado a tipo_usuario"
    );
    process.exit(0);
  } catch (error) {
    console.error("✗ Error actualizando schema:", error.message);
    process.exit(1);
  }
}

updateSchema();
