const db = require("./db");

async function initDb() {
  console.log("Iniciando configuración de base de datos PostgreSQL...");

  try {
    // Tabla Usuarios
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        documento TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        email TEXT,
        edad INTEGER,
        empresa_contratista TEXT,
        usuario TEXT UNIQUE NOT NULL,
        contraseña TEXT NOT NULL,
        tipo_usuario TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Tabla 'usuarios' verificada.");

    // Tabla Posiciones
    await db.query(`
      CREATE TABLE IF NOT EXISTS posiciones (
        Posiciones_Eti TEXT PRIMARY KEY,
        descripcion TEXT,
        activa BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Tabla 'posiciones' verificada.");

    // Tabla Materiales
    await db.query(`
      CREATE TABLE IF NOT EXISTS materiales (
        id_code TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        unit TEXT DEFAULT 'UNIDADES',
        type TEXT DEFAULT 'PRODUCTO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Tabla 'materiales' verificada.");

    // Tabla Stock Ubicaciones
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_ubicaciones (
        id TEXT NOT NULL,
        descrip TEXT,
        cantidad REAL DEFAULT 0,
        posicion TEXT NOT NULL,
        Usuario TEXT,
        lote TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, posicion)
      )
    `);
    console.log("✓ Tabla 'stock_ubicaciones' verificada.");

    // Tabla Historial Movimientos
    await db.query(`
      CREATE TABLE IF NOT EXISTS historial_movimientos (
        id SERIAL PRIMARY KEY,
        Id_codigo TEXT,
        Descripcion TEXT,
        Movimiento TEXT,
        Unit TEXT,
        T_movimi TEXT,
        Estado TEXT,
        Usuario TEXT,
        Turno TEXT,
        Fecha TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Tabla 'historial_movimientos' verificada.");

    // Crear usuario administrador por defecto si no existe
    const [existingAdmin] = await db.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      ["admin"]
    );
    if (existingAdmin.length === 0) {
      await db.query(
        `
        INSERT INTO usuarios (documento, nombre, apellido, edad, empresa_contratista, usuario, contraseña, tipo_usuario)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          "00000000",
          "Administrador",
          "Sistema",
          30,
          "Interno",
          "admin",
          "admin123",
          "administrador",
        ]
      );
      console.log("✓ Usuario 'admin' creado por defecto.");
    }

    console.log("Base de datos inicializada correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error inicializando base de datos:", error);
    process.exit(1);
  }
}

initDb();
