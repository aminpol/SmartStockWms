const { Pool } = require("pg");
require("dotenv").config();

// Crear pool de conexiones a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Wrapper para mantener compatibilidad con el código existente
const db = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      // Retornar en formato [rows, fields] similar a mysql2
      return [result.rows, result.fields];
    } finally {
      client.release();
    }
  },

  getConnection: async () => {
    const client = await pool.connect();
    return {
      query: async (text, params) => {
        const result = await client.query(text, params);
        return [result.rows, result.fields];
      },
      beginTransaction: async () => {
        await client.query("BEGIN");
      },
      commit: async () => {
        await client.query("COMMIT");
      },
      rollback: async () => {
        await client.query("ROLLBACK");
      },
      release: () => {
        client.release();
      },
    };
  },
};

module.exports = db;
