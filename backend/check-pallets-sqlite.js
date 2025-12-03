const db = require("./db");

const checkPallets = async () => {
  try {
    console.log("Conectado a la base de datos SQLite");
    console.log("Consultando tabla pallets...\n");

    const [rows] = await db.query(
      "SELECT * FROM pallets ORDER BY id DESC LIMIT 10"
    );

    if (rows.length === 0) {
      console.log("⚠️  La tabla pallets está vacía");
    } else {
      console.log(`✅ Se encontraron ${rows.length} registros:\n`);
      rows.forEach((row, index) => {
        console.log(`--- Registro ${index + 1} ---`);
        console.log(`ID: ${row.id}`);
        console.log(`Unique ID: ${row.unique_id}`);
        console.log(`Code: ${row.code}`);
        console.log(`Description: ${row.description}`);
        console.log(`Batch Code: ${row.batch_code}`);
        console.log(`Quantity: ${row.quantity} ${row.unit}`);
        console.log(`Created: ${row.created_at}`);
        console.log("");
      });
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error consultando la base de datos:", error);
    process.exit(1);
  }
};

checkPallets();
