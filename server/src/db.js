import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// Postgres returns BIGINT (int8) columns as strings by default, which breaks
// strict-equality id comparisons in the frontend (empty category dropdowns,
// false "not in this category" alerts). Ids fit safely in JS numbers here.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => (value === null ? null : Number(value)));

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
