const db = require("./db");
const fs = require("fs");
const path = require("path");

async function importData() {
  console.log("Importando datos desde MySQL dump...");

  try {
    // Importar usuarios
    console.log("Importando usuarios...");
    const usuarios = [
      [
        "1002100069",
        "Amin",
        "Polanco",
        32,
        "Soluambiente",
        "Apolanco",
        "1002100069",
        "bodega",
      ],
      [
        "3017421744",
        "Aminp",
        "Polancom",
        33,
        "Soluambiente",
        "Administrador",
        "Admin12345",
        "administrador",
      ],
    ];

    for (const user of usuarios) {
      try {
        await db.query(
          `
          INSERT INTO usuarios (documento, nombre, apellido, edad, empresa_contratista, usuario, contraseña, tipo_usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (documento) DO NOTHING
        `,
          user
        );
        console.log(`✓ Usuario ${user[5]} importado`);
      } catch (err) {
        console.log(`⚠ Usuario ${user[5]} ya existe o error:`, err.message);
      }
    }

    // Importar posiciones (ubicaciones)
    console.log("Importando posiciones...");
    const posiciones = [];
    for (let pasillo = 1; pasillo <= 15; pasillo++) {
      for (let pos = 1; pos <= 6; pos++) {
        const codigo = `LR-${String(pasillo).padStart(2, "0")}-${String(
          pos
        ).padStart(2, "0")}`;
        posiciones.push([
          codigo,
          `Almacén LR - Pasillo ${pasillo} - Posición ${pos}`,
          true,
        ]);
      }
    }

    for (const pos of posiciones) {
      try {
        await db.query(
          `
          INSERT INTO posiciones (Posiciones_Eti, descripcion, activa)
          VALUES ($1, $2, $3)
          ON CONFLICT (Posiciones_Eti) DO NOTHING
        `,
          pos
        );
      } catch (err) {
        console.log(`⚠ Posición ${pos[0]} error:`, err.message);
      }
    }
    console.log(`✓ ${posiciones.length} posiciones importadas`);

    // Importar materiales (solo los primeros 50 como ejemplo)
    // El resto se pueden agregar desde el panel de administrador
    console.log("Importando materiales de ejemplo...");
    const materialesEjemplo = [
      ["0", "Material de Prueba", "UND", "PRODUCTO"],
      ["120123", "RHODAPON LZS94/RP", "KG", "MTP"],
      ["120142", "RHODOPOL-23 25KG BAG", "KG", "MTP"],
      ["120155", "CALCIUM LIGNO SULPHONATE", "KG", "MTP"],
      ["120178", "HYDRO TREATED LIGHT PARAFIN(MINERAL OIL)", "KG", "MTP"],
      ["120197", "SAG 1572", "KG", "MTP"],
      ["120199", "STAB-41", "KG", "MTP"],
      ["150182", "AZOXYSTROBIN 98% TECH", "KG", "MTP"],
      ["190147", "OPARYL MT 705", "KG", "MTP"],
      ["191143", "UFOXANE 3A", "KG", "MTP"],
    ];

    for (const mat of materialesEjemplo) {
      try {
        await db.query(
          `
          INSERT INTO materiales (id_code, description, unit, type)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_code) DO NOTHING
        `,
          mat
        );
      } catch (err) {
        console.log(`⚠ Material ${mat[0]} error:`, err.message);
      }
    }
    console.log(
      `✓ ${materialesEjemplo.length} materiales de ejemplo importados`
    );
    console.log(
      "ℹ Los demás materiales se pueden agregar desde el panel de administrador"
    );

    console.log("✅ Importación completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la importación:", error);
    process.exit(1);
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  importData();
}

module.exports = importData;
