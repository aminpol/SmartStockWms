const fs = require("fs");
const path = require("path");
const db = require("./db");

async function importMateriales() {
  console.log(
    "🚀 Iniciando importación de materiales desde Materiales.csv a Neon.tech...\n"
  );

  try {
    const csvPath = path.join(__dirname, "Materiales.csv");

    if (!fs.existsSync(csvPath)) {
      throw new Error(
        "No se encontró el archivo Materiales.csv en la carpeta backend"
      );
    }

    // Leer archivo con encoding latin1 si es necesario por caracteres especiales,
    // pero probaremos utf8 primere (común en Node)
    const content = fs.readFileSync(csvPath, "utf8");
    const lines = content.split("\n");

    console.log(`📄 Archivo leído: ${lines.length} líneas`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    // Empezar desde 1 para saltar el encabezado: Code;Component Description;Unit;Material Type
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Separar por punto y coma (según el formato visto: Code;Component Description;Unit;Material Type)
      const parts = line.split(";");

      if (parts.length < 2) {
        console.warn(`⚠️ Línea ${i + 1} inválida o insuficiente: ${line}`);
        skipCount++;
        continue;
      }

      const code = parts[0].trim();
      const description = parts[1].trim();
      const unit = parts[2] ? parts[2].trim() : "UND";
      const type = parts[3] ? parts[3].trim() : "PRODUCTO";

      try {
        // Usamos el wrapper db.query que ya maneja el pool de pg
        await db.query(
          `INSERT INTO materiales (id_code, description, unit, type) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (id_code) 
                     DO UPDATE SET description = EXCLUDED.description, unit = EXCLUDED.unit, type = EXCLUDED.type`,
          [code, description, unit, type]
        );
        successCount++;
        if (successCount % 100 === 0) {
          process.stdout.write(".");
        }
      } catch (err) {
        console.error(`\n❌ Error en línea ${i + 1} (${code}): ${err.message}`);
        errorCount++;
      }
    }

    // Obtener total final usando el wrapper
    const [rows] = await db.query("SELECT COUNT(*) FROM materiales");
    const total = rows[0].count;

    console.log(`\n\n✅ Importación finalizada.`);
    console.log(`✨ Procesados exitosamente: ${successCount}`);
    console.log(`⚠️ Saltados: ${skipCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total actual en la tabla materiales: ${total}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error general:", error.message);
    process.exit(1);
  }
}

importMateriales();
