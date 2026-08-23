const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Connecting to postgres superuser...');
  const adminPool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  
  try {
    const roleCheck = await adminPool.query("SELECT 1 FROM pg_roles WHERE rolname = 'vargani_user'");
    if (roleCheck.rows.length === 0) {
      console.log('Creating role vargani_user...');
      await adminPool.query("CREATE ROLE vargani_user WITH LOGIN SUPERUSER PASSWORD 'vargani_password'");
    } else {
      console.log('Updating role vargani_user password...');
      await adminPool.query("ALTER ROLE vargani_user WITH LOGIN SUPERUSER PASSWORD 'vargani_password'");
    }

    const dbCheck = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = 'vargani_db'");
    if (dbCheck.rows.length === 0) {
      console.log('Creating database vargani_db...');
      await adminPool.query("CREATE DATABASE vargani_db OWNER vargani_user");
    }
  } finally {
    await adminPool.end();
  }

  console.log('Applying schema to vargani_db...');
  const varganiPool = new Pool({ connectionString: 'postgresql://vargani_user:vargani_password@localhost:5432/vargani_db' });
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src', 'schema.sql'), 'utf8');
    await varganiPool.query(schemaSql);
    console.log('Schema applied successfully!');
  } finally {
    await varganiPool.end();
  }
}

main().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
