// Script para migrar ubicaciones desde datos_ucpl a smartstockwms
const { Pool } = require('pg');

// Configuración de ambas bases de datos
const smartstockwmsPool = new Pool({
  connectionString: 'postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a.oregon-postgres.render.com/smartstockwms',
  ssl: { rejectUnauthorized: false }
});

const datos_ucplPool = new Pool({
  connectionString: 'postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a.oregon-postgres.render.com/datos_ucpl',
  ssl: { rejectUnauthorized: false }
});

async function migrateUbicaciones() {
  try {
    console.log('Iniciando migración de ubicaciones desde datos_ucpl a smartstockwms...');
    
    // 1. Conectar a datos_ucpl y obtener las ubicaciones
    const datos_ucplClient = await datos_ucplPool.connect();
    console.log('Conectado a datos_ucpl');
    
    const [ubicaciones] = await datos_ucplClient.query(`
      SELECT DISTINCT ubicaciones, descripcion, activa 
      FROM ubicaciones 
      WHERE ubicaciones IS NOT NULL 
      AND ubicaciones ~ '^LR-\d{2}-\d{2}$'
      ORDER BY ubicaciones
    `);
    
    console.log(`Encontradas ${ubicaciones.length} ubicaciones en datos_ucpl`);
    datos_ucplClient.release();
    
    if (ubicaciones.length === 0) {
      console.log('No hay ubicaciones para migrar');
      return;
    }
    
    // 2. Conectar a smartstockwms e insertar las ubicaciones
    const smartstockwmsClient = await smartstockwmsPool.connect();
    console.log('Conectado a smartstockwms');
    
    // Crear tabla si no existe
    await smartstockwmsClient.query(`
      CREATE TABLE IF NOT EXISTS ubicaciones (
        ubicaciones VARCHAR(50) PRIMARY KEY,
        descripcion TEXT,
        activa BOOLEAN DEFAULT TRUE
      )
    `);
    
    let migrated = 0;
    for (const ub of ubicaciones) {
      try {
        await smartstockwmsClient.query(`
          INSERT INTO ubicaciones (ubicaciones, descripcion, activa) 
          VALUES ($1, $2, $3)
          ON CONFLICT (ubicaciones) DO NOTHING
        `, [ub.ubicaciones, ub.descripcion || `Ubicación ${ub.ubicaciones}`, ub.activa !== false]);
        migrated++;
        console.log(`Migrada: ${ub.ubicaciones}`);
      } catch (err) {
        console.log(`Error migrando ${ub.ubicaciones}:`, err.message);
      }
    }
    
    // 3. Verificar la migración
    const [verify] = await smartstockwmsClient.query('SELECT COUNT(*) as total FROM ubicaciones');
    console.log(`Total ubicaciones en smartstockwms: ${verify[0].total}`);
    
    smartstockwmsClient.release();
    console.log(`Migración completada. ${migrated} ubicaciones migradas exitosamente.`);
    
  } catch (error) {
    console.error('Error en migración:', error);
  } finally {
    await smartstockwmsPool.end();
    await datos_ucplPool.end();
  }
}

migrateUbicaciones();
