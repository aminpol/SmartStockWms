require("dotenv").config();
const mysql = require("mysql2/promise");

const checkPallets = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Conectado a la base de datos");
    console.log("Consultando tabla pallets...\n");

    const [rows] = await connection.query(
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
  } catch (error) {
    console.error("❌ Error consultando la base de datos:", error);
  } finally {
    await connection.end();
  }
};

checkPallets();
