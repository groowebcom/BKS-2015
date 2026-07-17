import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_GOLD_PRICES,
  INITIAL_MONEY_TRANSACTIONS,
  INITIAL_GOLD_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_LOAN_PAYMENTS,
  INITIAL_AUDIT_LOGS
} from '../data';

const { Pool } = pkg;

export const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis: 2500,
      query_timeout: 2500,
      ssl: { rejectUnauthorized: false }, // Necessary for production connections to Supabase
      allowExitOnIdle: true,
      max: 4,
      idleTimeoutMillis: 1000,
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
    connectionTimeoutMillis: 4000,
    query_timeout: 4000,
    allowExitOnIdle: true,
    max: 4,
    idleTimeoutMillis: 1000,
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

    // Resilient Self-Healing Column Updates for existing tables
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE gold_prices ADD COLUMN IF NOT EXISTS updated_by TEXT;

      ALTER TABLE money_transactions ADD COLUMN IF NOT EXISTS is_reversaled BOOLEAN DEFAULT FALSE;
      ALTER TABLE money_transactions ADD COLUMN IF NOT EXISTS reversal_of TEXT;

      ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS is_reversaled BOOLEAN DEFAULT FALSE;
      ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS reversal_of TEXT;

      ALTER TABLE loans ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
    `);

    console.log('[Schema] All tables verified, created, and self-healed successfully.');
    await ensureSeeded(pool);
  } catch (err: any) {
    console.error('[Schema] Failed to run self-healing schema initialization:', err.message || err);
    throw err;
  }
};

export const ensureSeeded = async (pool: any) => {
  try {
    // 1. Seed users table if empty
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding users table with initial data...');
      for (const u of INITIAL_USERS) {
        await pool.query(
          'INSERT INTO users (id, username, name, role, status) VALUES ($1, $2, $3, $4, $5)',
          [u.id, u.username, u.name, u.role, u.status]
        );
      }
      console.log('[Schema] Seeded default users successfully.');
    }

    // 2. Seed customers table if empty
    const customersRes = await pool.query('SELECT COUNT(*) FROM customers');
    if (parseInt(customersRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding customers table with initial data...');
      for (const c of INITIAL_CUSTOMERS) {
        await pool.query(
          'INSERT INTO customers (id, member_number, name, nik, birth_date, phone, address, status, password_hash, is_first_login, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [c.id, c.memberNumber, c.name, c.nik, c.birthDate, c.phone, c.address, c.status, c.passwordHash, c.isFirstLogin, c.notes]
        );
      }
      console.log('[Schema] Seeded default customers successfully.');
    }

    // 3. Seed gold_prices table if empty
    const goldPricesRes = await pool.query('SELECT COUNT(*) FROM gold_prices');
    if (parseInt(goldPricesRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding gold_prices table with initial data...');
      for (const gp of INITIAL_GOLD_PRICES) {
        await pool.query(
          'INSERT INTO gold_prices (id, price, date, updated_by) VALUES ($1, $2, $3, $4)',
          [gp.id, gp.price, gp.date, gp.updatedBy]
        );
      }
      console.log('[Schema] Seeded initial Gold Prices successfully.');
    }

    // 4. Seed loans table if empty
    const loansRes = await pool.query('SELECT COUNT(*) FROM loans');
    if (parseInt(loansRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding loans table with initial data...');
      for (const l of INITIAL_LOANS) {
        await pool.query(
          'INSERT INTO loans (id, loan_number, customer_id, amount, outstanding, date, status, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [l.id, l.loanNumber, l.customerId, l.amount, l.outstanding, l.date, l.status, l.note]
        );
      }
      console.log('[Schema] Seeded initial loans successfully.');
    }

    // 5. Seed loan_payments table if empty
    const loanPaymentsRes = await pool.query('SELECT COUNT(*) FROM loan_payments');
    if (parseInt(loanPaymentsRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding loan_payments table with initial data...');
      for (const lp of INITIAL_LOAN_PAYMENTS) {
        await pool.query(
          'INSERT INTO loan_payments (id, loan_id, customer_id, amount, date, note, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [lp.id, lp.loanId, lp.customerId, lp.amount, lp.date, lp.note, lp.createdBy]
        );
      }
      console.log('[Schema] Seeded initial loan payments successfully.');
    }

    // 6. Seed money_transactions table if empty
    const moneyTxsRes = await pool.query('SELECT COUNT(*) FROM money_transactions');
    if (parseInt(moneyTxsRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding money_transactions table with initial data...');
      for (const mt of INITIAL_MONEY_TRANSACTIONS) {
        await pool.query(
          'INSERT INTO money_transactions (id, transaction_number, customer_id, type, amount, date, note, created_by, is_reversaled, reversal_of) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [mt.id, mt.transactionNumber, mt.customerId, mt.type, mt.amount, mt.date, mt.note, mt.createdBy, mt.isReversaled || false, mt.reversalOf || null]
        );
      }
      console.log('[Schema] Seeded initial money transactions successfully.');
    }

    // 7. Seed gold_transactions table if empty
    const goldTxsRes = await pool.query('SELECT COUNT(*) FROM gold_transactions');
    if (parseInt(goldTxsRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding gold_transactions table with initial data...');
      for (const gt of INITIAL_GOLD_TRANSACTIONS) {
        await pool.query(
          'INSERT INTO gold_transactions (id, transaction_number, customer_id, type, weight, gold_price_snapshot, amount_rupiah, date, note, created_by, is_reversaled, reversal_of) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
          [gt.id, gt.transactionNumber, gt.customerId, gt.type, gt.weight, gt.goldPriceSnapshot, gt.amountRupiah, gt.date, gt.note, gt.createdBy, gt.isReversaled || false, gt.reversalOf || null]
        );
      }
      console.log('[Schema] Seeded initial gold transactions successfully.');
    }

    // 8. Seed audit_logs table if empty
    const auditLogsRes = await pool.query('SELECT COUNT(*) FROM audit_logs');
    if (parseInt(auditLogsRes.rows[0].count, 10) === 0) {
      console.log('[Schema] Seeding audit_logs table with initial data...');
      for (const al of INITIAL_AUDIT_LOGS) {
        await pool.query(
          'INSERT INTO audit_logs (id, date, "user", role, activity, object, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [al.id, al.date, al.user, al.role, al.activity, al.object, al.ipAddress || null]
        );
      }
      console.log('[Schema] Seeded initial audit logs successfully.');
    }
  } catch (err) {
    console.error('[Schema] Error during ensuring seed data:', err);
  }
};

export const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Run self-healing schema initialization on startup (skip in serverless to prevent connection leaks & timeouts, initialized lazily instead)
export let isInitialized = false;
let initializingPromise: Promise<void> | null = null;
export let schemaInitError: any = null;

export const ensureSchemaInitialized = async () => {
  if (isInitialized) return;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    try {
      console.log('[Schema] Verifying database schema state with lightweight queries...');
      // Verify that all core tables exist and are queryable.
      // If any of them fail (e.g. table doesn't exist), we fall back to full schema initialization.
      await pool.query('SELECT id FROM users LIMIT 1');
      await pool.query('SELECT id FROM customers LIMIT 1');
      await pool.query('SELECT id FROM money_transactions LIMIT 1');
      await pool.query('SELECT id FROM gold_transactions LIMIT 1');
      await pool.query('SELECT id FROM loans LIMIT 1');
      
      console.log('[Schema] Database schema is fully verified and initialized. Checking for empty tables to seed...');
      await ensureSeeded(pool);
      
      isInitialized = true;
      schemaInitError = null;
    } catch (fastCheckErr: any) {
      console.log('[Schema] Lightweight check failed or tables do not exist. Falling back to full schema initialization...', fastCheckErr.message || fastCheckErr);
      try {
        await initializeSchema(pool);
        isInitialized = true;
        schemaInitError = null;
      } catch (err: any) {
        console.error('[Schema] Lazy schema initialization failed:', err);
        schemaInitError = err;
        initializingPromise = null; // allow retry on next request
        throw err;
      }
    }
  })();

  return initializingPromise;
};

if (process.env.VERCEL !== '1') {
  ensureSchemaInitialized().catch((err) => {
    console.error('[Schema] Failed to execute background initialization:', err);
  });
}

export const db = drizzle(pool, { schema });
export { schema };
