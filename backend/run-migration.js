const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Running migration: ${migrationFile}`);

  try {
    await pool.query(sql);
    console.log(`✓ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`✗ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
}

async function main() {
  const migrationFile = process.argv[2] || '006_create_evaluation_tables.sql';

  try {
    await runMigration(migrationFile);
    await pool.end();
    process.exit(0);
  } catch (error) {
    await pool.end();
    process.exit(1);
  }
}

main();
