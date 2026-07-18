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

// Helper to parse database connection string and URL-encode special characters in password
export const parseAndCorrectConnectionString = (url: string): string => {
  if (!url) return url;
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) return url;
  
  try {
    const protocolMatch = url.match(/^(postgres(?:ql)?):\/\//);
    if (!protocolMatch) return url;
    
    const protocol = protocolMatch[1];
    const remainder = url.slice(protocolMatch[0].length);
    
    const lastAtIndex = remainder.lastIndexOf('@');
    if (lastAtIndex === -1) return url;
    
    const credentials = remainder.slice(0, lastAtIndex); // 'username:password'
    const hostDb = remainder.slice(lastAtIndex + 1); // 'host:port/database'
    
    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) return url;
    
    const username = credentials.slice(0, colonIndex);
    const rawPassword = credentials.slice(colonIndex + 1);
    
    // Decode password first in case it is already partially/incorrectly encoded, then encode properly
    const decodedPassword = decodeURIComponent(rawPassword);
    const safeEncodedPassword = encodeURIComponent(decodedPassword);
    
    const correctedUrl = `${protocol}://${username}:${safeEncodedPassword}@${hostDb}`;
    return correctedUrl;
  } catch (err) {
    console.error('[Schema] Error auto-correcting connection string:', err);
    return url;
  }
};

// --- Resilient In-Memory Storage & Proxy for Demo Mode ---
export const memoryStore = {
  users: [...INITIAL_USERS],
  customers: [...INITIAL_CUSTOMERS],
  gold_prices: [...INITIAL_GOLD_PRICES],
  money_transactions: [...INITIAL_MONEY_TRANSACTIONS],
  gold_transactions: [...INITIAL_GOLD_TRANSACTIONS],
  loans: [...INITIAL_LOANS],
  loan_payments: [...INITIAL_LOAN_PAYMENTS],
  audit_logs: [...INITIAL_AUDIT_LOGS]
};

const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

const parseCondition = (cond: any) => {
  let field = '';
  let value = undefined;
  if (!cond) return { field, value };

  if (cond.column && cond.column.name) {
    field = cond.column.name;
  } else if (cond.left && cond.left.name) {
    field = cond.left.name;
  }

  if (cond.value !== undefined) {
    value = cond.value;
  } else if (cond.right !== undefined) {
    value = (cond.right && cond.right.value !== undefined) ? cond.right.value : cond.right;
  }

  if (!field) {
    const keys = Object.keys(cond);
    for (const k of keys) {
      if (cond[k] && cond[k].name) {
        field = cond[k].name;
        break;
      }
    }
  }

  return { field, value };
};

const getTableName = (table: any): string => {
  if (table && table._ && table._.name) {
    return table._.name;
  }
  const str = String(table).toLowerCase();
  if (str.includes('users')) return 'users';
  if (str.includes('customers')) return 'customers';
  if (str.includes('gold_prices')) return 'gold_prices';
  if (str.includes('money_transactions')) return 'money_transactions';
  if (str.includes('gold_transactions')) return 'gold_transactions';
  if (str.includes('loans')) return 'loans';
  if (str.includes('loan_payments')) return 'loan_payments';
  if (str.includes('audit_logs')) return 'audit_logs';
  return '';
};

class MockPool {
  on(event: string, callback: any) {
    // No-op
  }
  async query(sql: string, params: any[] = []) {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    
    if (cleanSql === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] };
    }
    
    const countMatch = cleanSql.match(/SELECT\s+COUNT\(\*\)(?:\s+as\s+count)?\s+FROM\s+(\w+)/i);
    if (countMatch) {
      const table = countMatch[1].toLowerCase();
      const list = (memoryStore as any)[table] || [];
      return { rows: [{ count: String(list.length) }] };
    }
    
    if (cleanSql.includes('SUBSTRING(id FROM 6)') && cleanSql.includes('customers')) {
      const values = memoryStore.customers
        .map(c => {
          const num = parseInt(c.id.replace('CUST-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(id FROM 4)') && cleanSql.includes('gold_prices')) {
      const values = memoryStore.gold_prices
        .map(g => {
          const num = parseInt(g.id.replace('GP-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(transaction_number FROM 10)') && cleanSql.includes('money_transactions')) {
      const values = memoryStore.money_transactions
        .map(m => {
          const num = parseInt(m.transactionNumber.replace('TX-MNY-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(transaction_number FROM 10)') && cleanSql.includes('gold_transactions')) {
      const values = memoryStore.gold_transactions
        .map(g => {
          const num = parseInt(g.transactionNumber.replace('TX-GLD-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(loan_number FROM 10)') && cleanSql.includes('loans')) {
      const values = memoryStore.loans
        .map(l => {
          const num = parseInt(l.loanNumber.replace('LN-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(id FROM 8)') && cleanSql.includes('loan_payments')) {
      const values = memoryStore.loan_payments
        .map(l => {
          const num = parseInt(l.id.replace('LP-PAY-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('SUBSTRING(id FROM 9)') && cleanSql.includes('audit_logs')) {
      const values = memoryStore.audit_logs
        .map(l => {
          const num = parseInt(l.id.replace('LOG-', ''), 10);
          return isNaN(num) ? 0 : num;
        });
      const maxVal = values.length > 0 ? Math.max(...values) : 0;
      return { rows: [{ max_val: maxVal }] };
    }

    if (cleanSql.includes('FROM customers WHERE id = $1 OR member_number = $2')) {
      const [id, memberNumber] = params;
      const found = memoryStore.customers.filter(c => c.id === id || c.memberNumber === memberNumber);
      return { rows: found };
    }

    if (cleanSql.includes('FROM gold_prices WHERE id = $1')) {
      const [id] = params;
      const found = memoryStore.gold_prices.filter(g => g.id === id);
      return { rows: found };
    }

    console.log(`[Mock Pool] Raw query processed: ${cleanSql}`);
    return { rows: [] };
  }
}

const createMockDrizzle = () => {
  return {
    select: () => {
      return {
        from: (table: any) => {
          const tableName = getTableName(table);
          const data = (memoryStore as any)[tableName] || [];
          
          const chain = {
            where: (condition: any) => {
              const { field, value } = parseCondition(condition);
              const jsField = toCamelCase(field);
              const filtered = data.filter((item: any) => {
                return item[field] === value || item[jsField] === value;
              });
              
              return {
                orderBy: (...args: any[]) => {
                  return {
                    then: (resolve: any) => resolve(filtered)
                  };
                },
                then: (resolve: any) => resolve(filtered)
              };
            },
            orderBy: (...args: any[]) => {
              if (tableName === 'audit_logs') {
                const sorted = [...data].sort((a: any, b: any) => b.id.localeCompare(a.id));
                return {
                  then: (resolve: any) => resolve(sorted)
                };
              }
              return {
                then: (resolve: any) => resolve(data)
              };
            },
            then: (resolve: any) => resolve(data)
          };
          
          return chain;
        }
      };
    },
    insert: (table: any) => {
      const tableName = getTableName(table);
      return {
        values: (val: any) => {
          const list = (memoryStore as any)[tableName] || [];
          const items = Array.isArray(val) ? val : [val];
          for (const item of items) {
            list.push(item);
          }
          return {
            returning: () => Promise.resolve(items),
            then: (resolve: any) => resolve(items)
          };
        }
      };
    },
    update: (table: any) => {
      const tableName = getTableName(table);
      return {
        set: (updateData: any) => {
          return {
            where: (condition: any) => {
              const { field, value } = parseCondition(condition);
              const jsField = toCamelCase(field);
              const list = (memoryStore as any)[tableName] || [];
              const updatedItems: any[] = [];
              for (let i = 0; i < list.length; i++) {
                if (list[i][field] === value || list[i][jsField] === value) {
                  list[i] = { ...list[i], ...updateData };
                  updatedItems.push(list[i]);
                }
              }
              return {
                returning: () => Promise.resolve(updatedItems),
                then: (resolve: any) => resolve(updatedItems)
              };
            }
          };
        }
      };
    },
    delete: (table: any) => {
      const tableName = getTableName(table);
      return {
        where: (condition: any) => {
          const { field, value } = parseCondition(condition);
          const jsField = toCamelCase(field);
          const list = (memoryStore as any)[tableName] || [];
          (memoryStore as any)[tableName] = list.filter((item: any) => {
            return item[field] !== value && item[jsField] !== value;
          });
          return Promise.resolve();
        }
      };
    }
  };
};

const mockPool = new MockPool();
const mockDrizzle = createMockDrizzle();

// --- Underlying variables for database connections ---
let activePool = createPool();
let activeDb = drizzle(activePool, { schema });

export let isDemoMode = false;
export let demoModeReason = '';

// Transparent ES Module proxies to dynamically routing to memory fallback if in Demo Mode
export const pool = new Proxy({}, {
  get(target, prop) {
    if (isDemoMode) {
      return (mockPool as any)[prop];
    }
    return (activePool as any)[prop];
  }
}) as any;

export const db = new Proxy({}, {
  get(target, prop) {
    if (isDemoMode) {
      return (mockDrizzle as any)[prop];
    }
    return (activeDb as any)[prop];
  }
}) as any;

pool.on('error', (err: any) => {
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
      
      // Try to correct connection string password if DATABASE_URL is set
      if (process.env.DATABASE_URL) {
        const correctedUrl = parseAndCorrectConnectionString(process.env.DATABASE_URL);
        if (correctedUrl !== process.env.DATABASE_URL) {
          console.log('[Schema] Re-initializing database pool with auto-corrected connection string password...');
          activePool = new Pool({
            connectionString: correctedUrl,
            connectionTimeoutMillis: 2500,
            query_timeout: 2500,
            ssl: { rejectUnauthorized: false },
            allowExitOnIdle: true,
            max: 4,
            idleTimeoutMillis: 1000,
          });
          activeDb = drizzle(activePool, { schema });
        }
      }

      // 1. Quick ping to test connectivity and timeout fast if unreachable
      try {
        await activePool.query('SELECT 1');
      } catch (pingErr: any) {
        console.error('[Schema] Database ping failed. Database is likely offline or unreachable:', pingErr.message || pingErr);
        throw new Error(`Database unreachable: ${pingErr.message || pingErr}`);
      }

      // 2. Verify tables in parallel so we don't block sequentially
      await Promise.all([
        activePool.query('SELECT id FROM users LIMIT 1'),
        activePool.query('SELECT id FROM customers LIMIT 1'),
        activePool.query('SELECT id FROM money_transactions LIMIT 1'),
        activePool.query('SELECT id FROM gold_transactions LIMIT 1'),
        activePool.query('SELECT id FROM loans LIMIT 1')
      ]);
      
      console.log('[Schema] Database schema is fully verified and initialized. Checking for empty tables to seed...');
      await ensureSeeded(activePool);
      
      isInitialized = true;
      schemaInitError = null;
      isDemoMode = false;
    } catch (fastCheckErr: any) {
      const errMsg = fastCheckErr.message || String(fastCheckErr);
      
      if (
        errMsg.includes('Database unreachable') || 
        errMsg.includes('password authentication') || 
        errMsg.includes('auth') || 
        errMsg.includes('ENOTFOUND') || 
        errMsg.includes('ECONNREFUSED') ||
        errMsg.includes('getaddrinfo')
      ) {
        console.warn(`[Schema] Database is unreachable or password auth failed (${errMsg}). Entering resilient In-Memory Demo Mode fallback...`);
        isDemoMode = true;
        demoModeReason = errMsg;
        isInitialized = true; // Set initialized to prevent retrying
        schemaInitError = null;
        return;
      }

      console.log('[Schema] Lightweight check failed or tables do not exist. Falling back to full schema initialization...', errMsg);
      try {
        await initializeSchema(activePool);
        isInitialized = true;
        schemaInitError = null;
        isDemoMode = false;
      } catch (err: any) {
        const fallbackErrMsg = err.message || String(err);
        if (
          fallbackErrMsg.includes('password authentication') || 
          fallbackErrMsg.includes('auth') || 
          fallbackErrMsg.includes('ENOTFOUND') || 
          fallbackErrMsg.includes('ECONNREFUSED') ||
          fallbackErrMsg.includes('getaddrinfo')
        ) {
          console.warn(`[Schema] Schema initialization failed due to auth/connection (${fallbackErrMsg}). Entering resilient In-Memory Demo Mode fallback...`);
          isDemoMode = true;
          demoModeReason = fallbackErrMsg;
          isInitialized = true;
          schemaInitError = null;
          return;
        }
        
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

export { schema };
