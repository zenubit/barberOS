import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name;
  `);
  console.log(res.rows.map(r => r.table_name).join('\n'));
  await client.end();
}

run();
