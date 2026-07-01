import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();
const { Client } = pg;

const sql = readFileSync(new URL('./supabase/schema.sql', import.meta.url), 'utf8');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to BarberOS Supabase Postgres');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
