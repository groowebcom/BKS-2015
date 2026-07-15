import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pkg;

export const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: false }, // Necessary for production connections to Supabase
    });
  }

  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  if (!host || !user || !password || !database) {
    console.warn('Database environment variables are missing. Connection pool may fail to initialize.');
  }

  return new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 15000,
  });
};

export const initializeSchema = async (pool: any) => {
  try {
    console.log('[Schema] Starting database self-healing initialization...');
    
    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        uid TEXT UNIQUE,
        username TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        member_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        nik TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        password_hash TEXT NOT NULL,
        is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Create gold_prices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gold_prices (
        id TEXT PRIMARY KEY,
        price DOUBLE PRECISION NOT NULL,
        date TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );
    `);

    // 4. Create money_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS money_transactions (
        id TEXT PRIMARY KEY,
        transaction_number TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        type TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        date TEXT NOT NULL,
        note TEXT NOT NULL,
        created_by TEXT NOT NULL,
        is_reversaled BOOLEAN DEFAULT FALSE,
        reversal_of TEXT
      );
    `);

    // 5. Create gold_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gold_transactions (
        id TEXT PRIMARY KEY,
        transaction_number TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        type TEXT NOT NULL,
        weight DOUBLE PRECISION NOT NULL,
        gold_price_snapshot DOUBLE PRECISION NOT NULL,
        amount_rupiah DOUBLE PRECISION NOT NULL,
        date TEXT NOT NULL,
        note TEXT NOT NULL,
        created_by TEXT NOT NULL,
        is_reversaled BOOLEAN DEFAULT FALSE,
        reversal_of TEXT
      );
    `);

    // 6. Create loans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        loan_number TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        amount DOUBLE PRECISION NOT NULL,
        outstanding DOUBLE PRECISION NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        note TEXT NOT NULL
      );
    `);

    // 7. Create loan_payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_payments (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL REFERENCES loans(id),
        customer_id TEXT NOT NULL REFERENCES customers(id),
        amount DOUBLE PRECISION NOT NULL,
        date TEXT NOT NULL,
        note TEXT NOT NULL,
        created_by TEXT NOT NULL
      );
    `);

    // 8. Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        "user" TEXT NOT NULL,
        role TEXT NOT NULL,
        activity TEXT NOT NULL,
        object TEXT NOT NULL,
        ip_address TEXT NOT NULL
      );
    `);

    console.log('[Schema] All tables verified and created successfully.');

    // Seed default owner user if users table is empty
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO users (id, username, name, role, status)
        VALUES ('USR-001', 'owner', 'BKS Gerai Owner', 'OWNER', 'ACTIVE')
      `);
      console.log('[Schema] Seeded default Owner user successfully.');
    }

    // Seed default gold price if gold_prices is empty
    const goldPricesRes = await pool.query('SELECT COUNT(*) FROM gold_prices');
    if (parseInt(goldPricesRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO gold_prices (id, price, date, updated_by)
        VALUES ('GP-001', 1410000, '${new Date().toISOString()}', 'System Seed')
      `);
      console.log('[Schema] Seeded initial Gold Price successfully.');
    }
  } catch (err: any) {
    console.error('[Schema] Failed to run self-healing schema initialization:', err.message || err);
  }
};

export const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Run self-healing schema initialization on startup (skip in serverless to prevent connection leaks & timeouts)
if (process.env.VERCEL !== '1') {
  initializeSchema(pool).catch((err) => {
    console.error('[Schema] Failed to execute background initialization:', err);
  });
}

export const db = drizzle(pool, { schema });
export { schema };
