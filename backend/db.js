const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log(
    "DATABASE_URL starts with:",
    process.env.DATABASE_URL.substring(0, 20)
  );
} else {
  console.log("DATABASE_URL is missing!");
}

// Crear pool de conexiones a PostgreSQL
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

// Habilitar SSL si estamos en producción (Render) o si la URL contiene 'render.com'
if (
  process.env.NODE_ENV === "production" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com"))
) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
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
