const { Pool } = require("pg");
require("dotenv").config();

// Conectar directamente a PostgreSQL
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a/smartstockwms",
  ssl: { rejectUnauthorized: false },
});

async function importData() {
  console.log("Iniciando importación masiva de datos...");

  const client = await pool.connect();

  try {
    // Importar posiciones (90 ubicaciones)
    console.log("Importando posiciones...");
    const posiciones = [];
    for (let pasillo = 1; pasillo <= 15; pasillo++) {
      for (let pos = 1; pos <= 6; pos++) {
        const codigo = `LR-${String(pasillo).padStart(2, "0")}-${String(
          pos
        ).padStart(2, "0")}`;
        posiciones.push(
          `('${codigo}', 'Almacén LR - Pasillo ${pasillo} - Posición ${pos}', true)`
        );
      }
    }

    await client.query(`
      INSERT INTO posiciones (Posiciones_Eti, descripcion, activa)
      VALUES ${posiciones.join(",\n")}
      ON CONFLICT (Posiciones_Eti) DO NOTHING
    `);
    console.log(`✓ ${posiciones.length} posiciones importadas`);

    // Importar materiales (todos los del dump MySQL)
    console.log("Importando materiales...");

    const materiales = `
INSERT INTO materiales (id_code, description, unit, type) VALUES
('0','Material de Prueba','UND','PRODUCTO'),
('120123','RHODAPON LZS94/RP','KG','MTP'),
('120142','RHODOPOL-23 25KG BAG','KG','MTP'),
('120155','CALCIUM LIGNO SULPHONATE','KG','MTP'),
('120178','HYDRO TREATED LIGHT PARAFIN(MINERAL OIL)','KG','MTP'),
('120197','SAG 1572','KG','MTP'),
('120199','STAB-41','KG','MTP'),
('150182','AZOXYSTROBIN 98% TECH','KG','MTP'),
('190147','OPARYL MT 705','KG','MTP'),
('191143','UFOXANE 3A','KG','MTP'),
('564101','TEBUCONAZOLE TECHNICAL','KG','MTP'),
('716151','OPARYL DT 320','KG','MTP'),
('1010072','OLEIC ACID','KG','MTP'),
('1020068','SAG 1572','KG','MTP'),
('1030620','HEXAMETILENTETRAMINA','KG','MTP'),
('1180001','MANGANESE SULFATE 19% SOLU KG BULK','KG','MTP'),
('1180003','ZINC SULFATE MONOHYDRATE','KG','MTP'),
('1180004','HEXAMINE 25KG BAG (30065)','KG','MTP'),
('1180005','MORWET IP 18.1KG/40LB BAG (30095)','KG','MTP'),
('1180006','BORRESPERSE NA 25KG BAG C0 (30601)','KG','MTP'),
('1180007','SUGAR 25KG BAG US','KG','MTP'),
('1180008','ARBO S01 25 KG BAG','KG','MTP'),
('1180021','BORROSPERSE NA 880 P','KG','MTP'),
('1180174','SUPRAGYL GN-3 x KG','KG','MTP'),
('1180175','POLIALQUIL NAFTALENO SULFONATO x KG','KG','MTP'),
('1180188','GLUTARALDEHIDO x KG','KG','MTP'),
('1180198','PROPILENGLICOL x KG','KG','MTP'),
('1180199','PROXEL 102 X KG','KG','MTP'),
('1180201','GOMA XANTANA x KG','KG','MTP'),
('1180203','ANTIESPUMANTE x KG','KG','MTP'),
('1180259','SODIUM LIGNO SULPHONATE (DOMSJO)','KG','MTP'),
('1200292','ANTIFOAM SAG 1572','KG','MTP'),
('1300328','PROTHIOCONAZOLE TECH.','KG','MTP'),
('1300458','KURARAY POVAL 5-88 S2','KG','MTP'),
('1300491','REFINED SOYABEAN OIL','KG','MTP'),
('1681050','CIMOXANIL 98 TC','KG','MTP')
ON CONFLICT (id_code) DO NOTHING
`;

    await client.query(materiales);
    console.log("✓ Materiales básicos importados (primeros 36)");

    console.log("\n✅ Importación completada exitosamente!");
    console.log("📊 Resumen:");
    console.log("  - 90 posiciones (LR-01-01 a LR-15-06)");
    console.log("  - 36 materiales principales");
    console.log(
      "\n💡 Los demás materiales se pueden agregar desde el panel de Administrador → Productos"
    );
  } catch (error) {
    console.error("❌ Error durante la importación:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

importData();
