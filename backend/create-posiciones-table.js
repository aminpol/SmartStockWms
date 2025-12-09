const db = require("./db");

async function createPosicionesTable() {
  try {
    console.log('Creando tabla "posiciones"...');
    
    // Crear la tabla si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS posiciones (
        Posiciones_Eti VARCHAR(100) PRIMARY KEY,
        descripcion VARCHAR(255),
        activa BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla "posiciones" creada/verificada exitosamente');

    // Verificar si la columna 'activa' existe, si no, agregarla
    try {
      const [columns] = await db.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE table_schema = 'public' 
         AND TABLE_NAME = 'posiciones' 
         AND COLUMN_NAME = 'activa'`
      );
      
      if (columns.length === 0) {
        await db.query(`
          ALTER TABLE posiciones 
          ADD COLUMN activa BOOLEAN DEFAULT TRUE
        `);
        console.log('✅ Columna "activa" agregada a la tabla posiciones');
      } else {
        console.log('ℹ️  La columna "activa" ya existe');
      }
    } catch (alterError) {
      console.warn('⚠️  No se pudo agregar la columna activa:', alterError.message);
    }

    // Insertar algunas posiciones de ejemplo (solo si no existen)
    const posicionesEjemplo = [
      { Posiciones_Eti: "LR-05-02", descripcion: "Almacén Principal - Pasillo LR, Estante 05, Posición 02" },
      { Posiciones_Eti: "33534", descripcion: "Almacén Secundario - Posición 33534" },
      // Puedes agregar más posiciones aquí
    ];

    console.log('\n📝 Insertando posiciones de ejemplo...');
    for (const pos of posicionesEjemplo) {
      const [existing] = await db.query(
        "SELECT Posiciones_Eti FROM posiciones WHERE Posiciones_Eti = ?",
        [pos.Posiciones_Eti]
      );

      if (existing.length === 0) {
        await db.query(
          "INSERT INTO posiciones (Posiciones_Eti, descripcion, activa) VALUES (?, ?, ?)",
          [pos.Posiciones_Eti, pos.descripcion, true]
        );
        console.log(`✅ Posición "${pos.Posiciones_Eti}" insertada`);
      } else {
        console.log(`ℹ️  La posición "${pos.Posiciones_Eti}" ya existe`);
      }
    }

    // Mostrar todas las posiciones
    const [allPosiciones] = await db.query("SELECT * FROM posiciones ORDER BY Posiciones_Eti");
    console.log('\n📋 Posiciones en el sistema:');
    if (allPosiciones.length > 0) {
      console.table(allPosiciones);
    } else {
      console.log('   (No hay posiciones registradas aún)');
    }

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creando tabla de posiciones:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

createPosicionesTable();

