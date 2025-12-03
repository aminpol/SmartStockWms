const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Crear conexión a la base de datos (archivo local)
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error conectando a SQLite:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Wrapper para soportar promesas y mantener compatibilidad con la sintaxis de mysql2
// mysql2 retorna [rows, fields], aquí simulamos eso retornando [rows, null]
const promiseDb = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Determinar si es una consulta de lectura (SELECT) o escritura (INSERT, UPDATE, DELETE)
      const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

      if (isSelect) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows, null]); // Formato compatible con mysql2
        });
      } else {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else {
            // En SQLite 'this' contiene lastID y changes
            resolve([{ insertId: this.lastID, affectedRows: this.changes }, null]);
          }
        });
      }
    });
  },
  // Método para cerrar la conexión si es necesario
  end: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = promiseDb;
