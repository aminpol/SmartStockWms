const db = require("./db");

const updateDatabase = async () => {
  try {
    console.log("Conectado a la base de datos SQLite");

    // Verificar si la tabla pallets existe
    const [tables] = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pallets'"
    );

    if (tables.length === 0) {
      console.log("ℹ️  La tabla 'pallets' no existe, creándola...");
      await db.query(`
        CREATE TABLE pallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unique_id VARCHAR(20) UNIQUE,
          code TEXT,
          description TEXT,
          batch_code TEXT,
          quantity REAL,
          unit TEXT DEFAULT 'UNIDADES',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Tabla 'pallets' creada con columna unique_id");
    } else {
      // Verificar si la columna unique_id existe
      const [columns] = await db.query("PRAGMA table_info(pallets)");
      const hasUniqueId = columns.some(col => col.name === 'unique_id');

      if (!hasUniqueId) {
        console.log("Agregando columna unique_id...");
        await db.query("ALTER TABLE pallets ADD COLUMN unique_id VARCHAR(20) UNIQUE");
        console.log("✅ Columna unique_id agregada exitosamente");
      } else {
        console.log("ℹ️  La columna unique_id ya existe");
      }
    }

    console.log("✅ Base de datos actualizada correctamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error actualizando la base de datos:", error);
    process.exit(1);
  }
};

updateDatabase();
