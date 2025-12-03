require("dotenv").config();
const mysql = require("mysql2/promise");

const updateDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Conectado a la base de datos");

    // Verificar si la columna unique_id ya existe
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM pallets LIKE 'unique_id'"
    );

    if (columns.length === 0) {
      console.log("Agregando columna unique_id...");
      await connection.query(
        "ALTER TABLE pallets ADD COLUMN unique_id VARCHAR(20) UNIQUE AFTER id"
      );
      console.log("✅ Columna unique_id agregada exitosamente");
    } else {
      console.log("ℹ️  La columna unique_id ya existe");
    }

    console.log("✅ Base de datos actualizada correctamente");
  } catch (error) {
    console.error("❌ Error actualizando la base de datos:", error);
  } finally {
    await connection.end();
  }
};

updateDatabase();
