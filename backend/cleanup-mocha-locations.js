const db = require('./db');

async function cleanupMochaLocations() {
  try {
    console.log('Limpiando ubicaciones "mochas" de stock_ubicaciones...');
    
    // Eliminar registros con posicion que no tenga formato LR-XX-XX exacto
    const [result] = await db.query(`
      DELETE FROM stock_ubicaciones 
      WHERE posicion !~ '^LR-\d{2}-\d{2}$'
    `);
    
    console.log(`Eliminados ${result.rowCount} registros con ubicaciones inválidas`);
    
    // Mostrar las ubicaciones que quedan
    const [remaining] = await db.query(`
      SELECT DISTINCT posicion FROM stock_ubicaciones 
      ORDER BY posicion
    `);
    
    console.log('Ubicaciones restantes:');
    remaining.forEach(row => {
      console.log(`  - ${row.posicion}`);
    });
    
    console.log('Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('Error al limpiar ubicaciones:', error);
    process.exit(1);
  }
}

cleanupMochaLocations();
