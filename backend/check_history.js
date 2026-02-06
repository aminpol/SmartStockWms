const db = require("./db");
const fs = require("fs");

async function checkHistorySchema() {
  try {
    const [cols] = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'historial_movimientos'
    `);

    const [data] = await db.query(
      "SELECT COUNT(*) as count FROM historial_movimientos"
    );

    let content = "Columnas:\n";
    cols.forEach((c) => (content += `- ${c.column_name} (${c.data_type})\n`));
    content += `\nRegistros: ${data[0].count}\n`;

    fs.writeFileSync("backend/history_debug.txt", content);
    console.log("Debug info written to backend/history_debug.txt");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
checkHistorySchema();
