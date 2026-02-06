const db = require("./db");

async function checkPositions() {
  try {
    console.log("🔍 Verificando posiciones en la base de datos...");

    // Ver cuántas posiciones hay en total
    const [countRes] = await db.query(
      "SELECT COUNT(*) as count FROM posiciones"
    );
    console.log(`📊 Total posiciones: ${countRes[0].count}`);

    // Ver si LR-10-03 existe
    const [posRes] = await db.query(
      "SELECT * FROM posiciones WHERE Posiciones_Eti = $1",
      ["LR-10-03"]
    );

    if (posRes.length > 0) {
      console.log("✅ LR-10-03 encontrada:", posRes[0]);
    } else {
      console.log("❌ LR-10-03 NO encontrada.");

      // Ver algunas posiciones que sí existen
      const [limitRes] = await db.query(
        "SELECT Posiciones_Eti FROM posiciones LIMIT 5"
      );
      console.log(
        "Ejemplos de posiciones existentes:",
        limitRes.map((r) => r.posiciones_eti)
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error verificando posiciones:", error);
    process.exit(1);
  }
}

checkPositions();
