import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function initTables() {
  // Create projects and materials tables if they don't exist
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT,
      customer TEXT,
      application TEXT,
      product_line TEXT,
      anual_volume TEXT,
      est_sop TEXT,
      percent INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT
    );
  `);

  // ensure status column exists to store per-material checkbox states
  await query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS status jsonb DEFAULT '[]'::jsonb`);
  // ensure percent column exists on materials to store computed percent
  await query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS percent INTEGER DEFAULT 0`);
  // ensure percent column exists on projects (already added above via create)
  await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS percent INTEGER DEFAULT 0`);

  // uploads table for storing uploaded file metadata
  await query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
      filename TEXT,
      path TEXT,
      size INTEGER,
      mime TEXT,
      status_index INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);
  // ensure status_index column exists for uploads (nullable int)
  await query(`ALTER TABLE uploads ADD COLUMN IF NOT EXISTS status_index INTEGER`);

  // remarks table to store per-project, per-column remarks with timestamps
  await query(`
    CREATE TABLE IF NOT EXISTS remarks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      status_index INTEGER,
      text TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);
}
