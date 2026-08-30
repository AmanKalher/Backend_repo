import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { Pool } = require("pg");
require("dotenv").config();

const connectionConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
      }
    : {
          host: process.env.DB_HOST || process.env.PGHOST || "localhost",
          port: parseInt(process.env.DB_PORT || process.env.PGPORT || "5432", 10),
          database: process.env.DB_NAME || process.env.PGDATABASE || "medtech_db",
          user: process.env.DB_USER || process.env.PGUSER || "postgres",
          password: String(process.env.DB_PASSWORD || process.env.PGPASSWORD || "postgres"),
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
      };

const pool = new Pool(connectionConfig);

pool.on("connect", () => {
    console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client", err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export { pool };
export default {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
};
