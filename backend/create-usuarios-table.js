const db = require("./db");

async function createUsuariosTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        documento VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        edad INT,
        empresa_contratista VARCHAR(200),
        usuario VARCHAR(50) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        tipo_usuario ENUM('bodega', 'administrativo') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Tabla usuarios creada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error creando tabla:", error.message);
    process.exit(1);
  }
}

createUsuariosTable();
