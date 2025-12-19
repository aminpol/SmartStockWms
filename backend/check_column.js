const db = require('./db');

async function checkPlantaColumn() {
  try {
    console.log('Verificando si existe la columna planta...');
    const [rows] = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pallets_ground' 
      AND column_name = 'planta'
    `);
    
    console.log('Columna planta existe:', rows.length > 0);
    
    if (rows.length === 0) {
      console.log('La columna planta NO existe. Ejecuta este SQL:');
      console.log('ALTER TABLE pallets_ground ADD COLUMN planta VARCHAR(20) DEFAULT \'UPF-22\';');
    } else {
      console.log('La columna planta SÍ existe.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPlantaColumn();
