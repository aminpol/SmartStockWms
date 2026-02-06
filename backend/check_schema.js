const db = require("./db");
async function checkSchema() {
  try {
    console.log("🔍 Verificando esquema de stock_ubicaciones...");

    // Ver columnas
    const [cols] = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stock_ubicaciones'
    `);
    console.log("Columnas en stock_ubicaciones:");
    cols.forEach((c) => console.log(`- ${c.column_name} (${c.data_type})`));

    // Ver Primary Key
    const [pk] = await db.query(`
      SELECT 
        kcu.column_name
      FROM 
        information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name 
          AND tc.table_schema = kcu.table_schema
      WHERE 
        tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_name = 'stock_ubicaciones';
    `);
    console.log(
      "Primary Key actual:",
      pk.map((r) => r.column_name)
    );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
checkSchema();
