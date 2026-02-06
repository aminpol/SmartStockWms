const db = require("./db");
async function run() {
  try {
    const [r] = await db.query(
      "SELECT posiciones_eti FROM posiciones WHERE posiciones_eti = 'LR-10-03'"
    );
    console.log(
      "EXISTE:",
      r.length > 0 ? "SI" : "NO",
      "TOTAL:",
      (await db.query("SELECT COUNT(*) FROM posiciones"))[0][0].count
    );
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
