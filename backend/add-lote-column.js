const db = require('./db');

async function addLoteColumn() {
  try {
    console.log('Agregando columna "lote" a la tabla stock_ubicaciones...');
    
    // Verificar si la columna ya existe
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_schema = 'public' 
      AND TABLE_NAME = 'stock_ubicaciones' 
      AND COLUMN_NAME = 'lote'
    `);
    
    if (columns.length === 0) {
      // La columna no existe, agregarla
      await db.query(`
        ALTER TABLE stock_ubicaciones 
        ADD COLUMN lote VARCHAR(50) NULL 
        AFTER posicion
      `);
      console.log('✅ Columna "lote" agregada exitosamente');
    } else {
      console.log('ℹ️ La columna "lote" ya existe en la tabla');
    }
    
    // Mostrar la estructura actualizada de la tabla
    const [structure] = await db.query(`
      DESCRIBE stock_ubicaciones
    `);
    
    console.log('\n📋 Estructura actual de la tabla stock_ubicaciones:');
    console.table(structure);
    
  } catch (error) {
    console.error('❌ Error al agregar la columna lote:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addLoteColumn();
