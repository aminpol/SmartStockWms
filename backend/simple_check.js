const db = require('./db');

db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'pallets_ground\' AND column_name = \'planta\'')
  .then(([rows]) => {
    console.log('Columna planta existe:', rows.length > 0);
    if (rows.length === 0) {
      console.log('Ejecuta: ALTER TABLE pallets_ground ADD COLUMN planta VARCHAR(20) DEFAULT \'UPF-22\';');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
