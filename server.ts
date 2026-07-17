import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import path from 'path';
import { db, pool, initializeSchema, ensureSchemaInitialized, isInitialized, schemaInitError } from './src/db/index';
import {
  users,
  customers,
  goldPrices,
  moneyTransactions,
  goldTransactions,
  loans,
  loanPayments,
  auditLogs,
} from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

const app = express();
app.use(express.json());

function validateConnectionString(url: string): { valid: boolean; error?: string; suggestion?: string } {
  const placeholders = ['[password]', '<password>', '[your-password]', '[your_password]', 'your-password', 'your_password', 'yourpassword', 'password_kamu'];
  for (const placeholder of placeholders) {
    if (url.toLowerCase().includes(placeholder)) {
      return {
        valid: false,
        error: 'DATABASE_URL masih menggunakan placeholder password.',
        suggestion: `Silakan ganti kata "${placeholder}" di dalam DATABASE_URL dengan password asli database Supabase Anda.`
      };
    }
  }

  // Check if password has special characters and is not URL encoded
  try {
    const match = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@/);
    if (match) {
      const password = match[2];
      if (password.includes('@') || password.includes(':') || password.includes('/') || password.includes('?') || password.includes('#')) {
        return {
          valid: false,
          error: 'Password database Anda mengandung karakter khusus yang belum di-URL-encode.',
          suggestion: 'Jika password database Supabase Anda mengandung karakter khusus seperti @, :, /, ?, atau #, Anda harus melakukan URL-encode pada karakter tersebut (misalnya @ menjadi %40, # menjadi %23) atau membuat password baru di Supabase yang hanya terdiri dari huruf dan angka agar koneksi tidak error.'
        };
      }
    }
  } catch (e) {
    // Ignore parsing error
  }

  return { valid: true };
}

function logAndFormatDbError(err: any, actionDescription: string) {
  console.error(`[DB ERROR] Failed during: ${actionDescription}`, err);
  if (err && typeof err === 'object') {
    const cause = err.cause || err.originalError;
    if (cause) {
      console.error(`[DB ERROR DETAIL] Cause:`, {
        message: cause.message,
        detail: cause.detail,
        hint: cause.hint,
        code: cause.code,
        constraint: cause.constraint,
        table: cause.table,
      });
      return `${err.message || err} (${cause.detail || cause.message || ''})`;
    }
  }
  return err?.message || String(err);
}

// Database Configuration Guard Middleware
app.use(async (req, res, next) => {
  // Allow health check, init-db and assets to pass without DB configuration
  if (req.path === '/api/health' || req.path === '/api/init-db' || req.path === '/api/db-diagnostics' || !req.path.startsWith('/api/')) {
    return next();
  }

  const hasDbUrl = process.env.DATABASE_URL && 
    (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));
  const hasSqlCreds = !!(process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME);

  if (!hasDbUrl && !hasSqlCreds) {
    console.warn(`[DB Guard] Blocked request to ${req.path} because no database configuration was found in environment variables.`);
    return res.status(503).json({
      error: 'Konfigurasi database tidak ditemukan.',
      message: 'DATABASE_URL (untuk Supabase) atau SQL_HOST/SQL_USER tidak terdefinisi di Environment Variables Vercel atau Production.',
      suggestion: 'Silakan buka dashboard Vercel / Cloud Run Anda, masuk ke Project Settings -> Environment Variables, lalu tambahkan DATABASE_URL dengan Connection String database PostgreSQL (dari Supabase) Anda.',
      missingConfig: true
    });
  }

  if (hasDbUrl) {
    const validation = validateConnectionString(process.env.DATABASE_URL!);
    if (!validation.valid) {
      return res.status(503).json({
        error: validation.error,
        message: 'Password di DATABASE_URL belum diatur dengan benar.',
        suggestion: validation.suggestion,
        missingConfig: true
      });
    }
  }

  try {
    await ensureSchemaInitialized();
  } catch (err: any) {
    console.error('[DB Guard] Failed during lazy schema initialization:', err);
    const errMessage = err.message || String(err);
    let friendlyMessage = 'Gagal melakukan koneksi & inisialisasi database (Supabase/PostgreSQL).';
    let friendlySuggestion = 'Silakan periksa apakah database Anda di Supabase aktif (tidak sedang di-pause/suspended), dan pastikan Connection String & Password Anda benar.';

    if (errMessage.includes('password authentication failed') || errMessage.includes('auth')) {
      friendlyMessage = 'Otentikasi password database gagal (Password Supabase salah).';
      friendlySuggestion = 'Password database Anda di dalam DATABASE_URL salah. Harap periksa kembali password database Supabase Anda dan pastikan tidak ada karakter khusus yang tidak di-URL-encode.';
    } else if (errMessage.includes('ENOTFOUND') || errMessage.includes('getaddrinfo') || errMessage.includes('not found')) {
      friendlyMessage = 'Host database tidak dapat ditemukan (Alamat salah).';
      friendlySuggestion = 'Alamat host di dalam DATABASE_URL Anda salah atau tidak valid. Silakan periksa kembali apakah Anda menyalin Connection String dari Supabase dengan benar.';
    } else if (errMessage.includes('ECONNREFUSED')) {
      friendlyMessage = 'Koneksi ke database ditolak (Connection Refused).';
      friendlySuggestion = 'Database menolak koneksi. Pastikan database Anda di Supabase sedang aktif (tidak sedang di-pause/suspended) dan port yang digunakan sudah benar.';
    } else if (errMessage.includes('ETIMEDOUT') || errMessage.includes('timeout') || errMessage.includes('time out')) {
      friendlyMessage = 'Koneksi ke database timeout (Waktu habis).';
      friendlySuggestion = 'Waktu koneksi ke database habis. Ini terjadi karena host tidak bisa dijangkau atau salah. Pastikan proyek Supabase Anda aktif dan salin Connection String yang benar.';
    }

    return res.status(503).json({
      error: friendlyMessage,
      message: errMessage,
      suggestion: friendlySuggestion,
      missingConfig: true
    });
  }

  next();
});

  // API Endpoints for BKS Savings System

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1.5. Manual database self-healing initializer
  app.get('/api/init-db', async (req, res) => {
    try {
      await initializeSchema(pool);
      res.json({ status: 'success', message: 'Database schema self-healing initialization completed successfully.' });
    } catch (error: any) {
      console.error('Manual DB Init Error:', error);
      res.status(500).json({ error: `Manual initialization failed: ${error.message || error}` });
    }
  });

  // 1.6. Database Diagnostics endpoint for OWNER/ADMIN dashboard
  app.get('/api/db-diagnostics', async (req, res) => {
    try {
      const dbType = process.env.DATABASE_URL ? 'Supabase (PostgreSQL)' : 'Cloud SQL (Google Cloud)';
      const connectionStringInfo = process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') // redact database password
        : 'Cloud SQL config';

      // 1. First test connectivity fast
      try {
        await pool.query('SELECT 1');
      } catch (pingErr: any) {
        return res.status(503).json({
          status: 'error',
          error: 'Database tidak dapat dijangkau (Connection Failed)',
          message: pingErr.message || String(pingErr),
          databaseType: dbType,
          connectionString: connectionStringInfo,
          suggestion: 'Harap periksa DATABASE_URL di Environment Variables Vercel Anda, dan pastikan proyek database Supabase Anda aktif dan tidak di-suspend atau di-pause.'
        });
      }

      // Check table counts helper
      const getCount = async (tableName: string) => {
        try {
          const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
          return parseInt(result.rows[0].count, 10);
        } catch (e: any) {
          return `Tabel tidak ditemukan / Error: ${e.message || e}`;
        }
      };

      // 2. Fetch all counts in parallel so it doesn't take multiple timeouts sequentially
      const tables = ['users', 'customers', 'gold_prices', 'money_transactions', 'gold_transactions', 'loans', 'loan_payments', 'audit_logs'];
      const counts = await Promise.all(tables.map(async (t) => {
        return { name: t, count: await getCount(t) };
      }));

      const tableCounts: Record<string, any> = {};
      for (const item of counts) {
        tableCounts[item.name] = item.count;
      }

      res.json({
        status: 'ok',
        databaseType: dbType,
        connectionString: connectionStringInfo,
        tableCounts,
        isInitialized,
        schemaInitError: schemaInitError ? String(schemaInitError) : null,
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        message: err.message || String(err),
      });
    }
  });

  // 2. Customers
  app.get('/api/customers', async (req, res) => {
    try {
      const allCustomers = await db.select().from(customers);
      res.json(allCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const data = req.body;
      if (!data.id || !data.memberNumber || !data.name || !data.nik || !data.birthDate || !data.phone || !data.address) {
        return res.status(400).json({ error: 'Missing required customer fields' });
      }

      const existing = await db.select().from(customers).where(eq(customers.id, data.id));
      if (existing.length > 0 && existing[0].memberNumber === data.memberNumber) {
        // Update
        const updated = await db.update(customers)
          .set({
            name: data.name,
            nik: data.nik,
            birthDate: data.birthDate,
            phone: data.phone,
            address: data.address,
            status: data.status || 'ACTIVE',
            passwordHash: data.passwordHash,
            isFirstLogin: data.isFirstLogin !== undefined ? data.isFirstLogin : false,
            notes: data.notes || null,
          })
          .where(eq(customers.id, data.id))
          .returning();
        return res.json(updated[0]);
      } else {
        // Insert
        // Efficient ID and Member Number generation using optimized database queries
        const lastCustRes = await pool.query(`
          SELECT MAX(CAST(SUBSTRING(id FROM 6) AS INTEGER)) as max_val 
          FROM customers 
          WHERE id LIKE 'CUST-%'
        `);
        const maxId = lastCustRes.rows[0].max_val || 0;
        
        const countRes = await pool.query(`SELECT COUNT(*) as count FROM customers`);
        const totalCount = parseInt(countRes.rows[0].count, 10);
        
        const nextCount = Math.max(totalCount, maxId) + 1;
        
        let targetId = data.id || 'CUST-' + nextCount.toString().padStart(3, '0');
        let targetMemberNumber = data.memberNumber || 'BKS-2026-' + nextCount.toString().padStart(3, '0');

        // Fast collision check
        const checkRes = await pool.query(
          `SELECT id FROM customers WHERE id = $1 OR member_number = $2`,
          [targetId, targetMemberNumber]
        );

        if (checkRes.rows.length > 0) {
          const rand = Math.floor(Math.random() * 1000);
          targetId = `CUST-${Date.now()}-${rand}`;
          targetMemberNumber = `BKS-2026-${Date.now()}-${rand}`;
        }

        const inserted = await db.insert(customers)
          .values({
            id: targetId,
            memberNumber: targetMemberNumber,
            name: data.name,
            nik: data.nik,
            birthDate: data.birthDate,
            phone: data.phone,
            address: data.address,
            status: data.status || 'ACTIVE',
            passwordHash: data.passwordHash || data.birthDate.replace(/-/g, ''), // Default simple password is DOB DDMMYYYY
            isFirstLogin: data.isFirstLogin !== undefined ? data.isFirstLogin : true,
            notes: data.notes || null,
          })
          .returning();
        return res.json(inserted[0]);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      res.status(500).json({ error: 'Failed to save customer' });
    }
  });

  // 3. Gold Prices
  app.get('/api/gold-prices', async (req, res) => {
    try {
      const prices = await db.select().from(goldPrices);
      res.json(prices);
    } catch (error: any) {
      console.error('Error fetching gold prices:', error);
      res.status(500).json({ error: `Gagal mengambil harga emas: ${error.message || error}` });
    }
  });

  app.post('/api/gold-prices', async (req, res) => {
    try {
      const data = req.body;
      if (!data.price || !data.date || !data.updatedBy) {
        return res.status(400).json({ error: 'Missing required gold price fields' });
      }

      let targetId = data.id;

      // Efficient ID generation using optimized database query
      const gpRes = await pool.query(`
        SELECT MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)) as max_val 
        FROM gold_prices 
        WHERE id LIKE 'GP-%'
      `);
      const maxId = gpRes.rows[0].max_val || 0;
      
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM gold_prices`);
      const totalCount = parseInt(countRes.rows[0].count, 10);
      
      const nextCount = Math.max(totalCount, maxId) + 1;

      if (!targetId) {
        targetId = 'GP-' + nextCount.toString().padStart(3, '0');
      }

      // Fast collision check
      const checkRes = await pool.query(
        `SELECT id FROM gold_prices WHERE id = $1`,
        [targetId]
      );

      if (checkRes.rows.length > 0) {
        const rand = Math.floor(Math.random() * 1000);
        targetId = `GP-${Date.now()}-${rand}`;
      }

      const inserted = await db.insert(goldPrices)
        .values({
          id: targetId,
          price: Number(data.price),
          date: data.date,
          updatedBy: data.updatedBy,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error: any) {
      console.error('Error saving gold price:', error);
      res.status(500).json({ error: `Gagal menyimpan harga emas: ${error.message || error}` });
    }
  });

  // 4. Money Transactions
  app.get('/api/money-transactions', async (req, res) => {
    try {
      const transactions = await db.select().from(moneyTransactions);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching money transactions:', error);
      res.status(500).json({ error: 'Failed to fetch money transactions' });
    }
  });

  app.post('/api/money-transactions', async (req, res) => {
    try {
      const data = req.body;
      if (!data.customerId || !data.type || data.amount === undefined || !data.date || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required money transaction fields' });
      }

      let targetId = data.id;
      let targetTxNumber = data.transactionNumber;

      // Efficient ID and Transaction Number generation using optimized database query
      const mtRes = await pool.query(`
        SELECT MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)) as max_val 
        FROM money_transactions 
        WHERE id LIKE 'MT-%'
      `);
      const maxId = mtRes.rows[0].max_val || 0;
      
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM money_transactions`);
      const totalCount = parseInt(countRes.rows[0].count, 10);
      
      const nextCount = Math.max(totalCount, maxId) + 1;

      if (!targetId || !targetTxNumber) {
        targetId = 'MT-' + nextCount.toString().padStart(3, '0');
        targetTxNumber = 'TXM-2026-' + nextCount.toString().padStart(4, '0');
      }

      // Fast collision check
      const checkRes = await pool.query(
        `SELECT id FROM money_transactions WHERE id = $1 OR transaction_number = $2`,
        [targetId, targetTxNumber]
      );

      if (checkRes.rows.length > 0) {
        const rand = Math.floor(Math.random() * 1000);
        targetId = `MT-${Date.now()}-${rand}`;
        targetTxNumber = `TXM-2026-${Date.now()}-${rand}`;
      }

      const inserted = await db.insert(moneyTransactions)
        .values({
          id: targetId,
          transactionNumber: targetTxNumber,
          customerId: data.customerId,
          type: data.type,
          amount: Number(data.amount),
          date: data.date,
          note: data.note || '',
          createdBy: data.createdBy,
          isReversaled: data.isReversaled || false,
          reversalOf: data.reversalOf || null,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      const detailedMessage = logAndFormatDbError(error, 'saving money transaction');
      res.status(500).json({ error: `Failed to save money transaction: ${detailedMessage}` });
    }
  });

  app.put('/api/money-transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await db.update(moneyTransactions)
        .set({
          isReversaled: data.isReversaled,
          reversalOf: data.reversalOf,
        })
        .where(eq(moneyTransactions.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      console.error('Error updating money transaction:', error);
      res.status(500).json({ error: 'Failed to update money transaction' });
    }
  });

  // 5. Gold Transactions
  app.get('/api/gold-transactions', async (req, res) => {
    try {
      const transactions = await db.select().from(goldTransactions);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching gold transactions:', error);
      res.status(500).json({ error: 'Failed to fetch gold transactions' });
    }
  });

  app.post('/api/gold-transactions', async (req, res) => {
    try {
      const data = req.body;
      if (!data.customerId || !data.type || data.weight === undefined || data.goldPriceSnapshot === undefined || data.amountRupiah === undefined || !data.date || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required gold transaction fields' });
      }

      let targetId = data.id;
      let targetTxNumber = data.transactionNumber;

      // Efficient ID and Transaction Number generation using optimized database query
      const gtRes = await pool.query(`
        SELECT MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)) as max_val 
        FROM gold_transactions 
        WHERE id LIKE 'GT-%'
      `);
      const maxId = gtRes.rows[0].max_val || 0;
      
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM gold_transactions`);
      const totalCount = parseInt(countRes.rows[0].count, 10);
      
      const nextCount = Math.max(totalCount, maxId) + 1;

      if (!targetId || !targetTxNumber) {
        targetId = 'GT-' + nextCount.toString().padStart(3, '0');
        targetTxNumber = 'TXG-2026-' + nextCount.toString().padStart(4, '0');
      }

      // Fast collision check
      const checkRes = await pool.query(
        `SELECT id FROM gold_transactions WHERE id = $1 OR transaction_number = $2`,
        [targetId, targetTxNumber]
      );

      if (checkRes.rows.length > 0) {
        const rand = Math.floor(Math.random() * 1000);
        targetId = `GT-${Date.now()}-${rand}`;
        targetTxNumber = `TXG-2026-${Date.now()}-${rand}`;
      }

      const inserted = await db.insert(goldTransactions)
        .values({
          id: targetId,
          transactionNumber: targetTxNumber,
          customerId: data.customerId,
          type: data.type,
          weight: Number(data.weight),
          goldPriceSnapshot: Number(data.goldPriceSnapshot),
          amountRupiah: Number(data.amountRupiah),
          date: data.date,
          note: data.note || '',
          createdBy: data.createdBy,
          isReversaled: data.isReversaled || false,
          reversalOf: data.reversalOf || null,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving gold transaction:', error);
      res.status(500).json({ error: 'Failed to save gold transaction' });
    }
  });

  app.put('/api/gold-transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await db.update(goldTransactions)
        .set({
          isReversaled: data.isReversaled,
          reversalOf: data.reversalOf,
        })
        .where(eq(goldTransactions.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      console.error('Error updating gold transaction:', error);
      res.status(500).json({ error: 'Failed to update gold transaction' });
    }
  });

  // 6. Loans
  app.get('/api/loans', async (req, res) => {
    try {
      const allLoans = await db.select().from(loans);
      res.json(allLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      res.status(500).json({ error: 'Failed to fetch loans' });
    }
  });

  app.post('/api/loans', async (req, res) => {
    try {
      const data = req.body;
      if (!data.customerId || data.amount === undefined || data.outstanding === undefined || !data.date || !data.note) {
        return res.status(400).json({ error: 'Missing required loan fields' });
      }

      let targetId = data.id;
      let targetLoanNumber = data.loanNumber;

      const allLoans = await db.select().from(loans);
      const existingIds = new Set(allLoans.map(l => l.id));
      const existingLoanNumbers = new Set(allLoans.map(l => l.loanNumber));

      if (!targetId || existingIds.has(targetId) || !targetLoanNumber || existingLoanNumbers.has(targetLoanNumber)) {
        const maxId = allLoans.reduce((max, item) => {
          const match = item.id.match(/^LN-(\d+)$/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        const nextCount = Math.max(allLoans.length, maxId) + 1;
        targetId = 'LN-' + nextCount.toString().padStart(3, '0');
        targetLoanNumber = 'LOAN-2026-' + nextCount.toString().padStart(4, '0');

        while (existingIds.has(targetId) || existingLoanNumbers.has(targetLoanNumber)) {
          const rand = Math.floor(Math.random() * 1000);
          targetId = `LN-${Date.now()}-${rand}`;
          targetLoanNumber = `LOAN-2026-${Date.now()}-${rand}`;
        }
      }

      const inserted = await db.insert(loans)
        .values({
          id: targetId,
          loanNumber: targetLoanNumber,
          customerId: data.customerId,
          amount: Number(data.amount),
          outstanding: Number(data.outstanding),
          date: data.date,
          status: data.status || 'ACTIVE',
          note: data.note,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving loan:', error);
      res.status(500).json({ error: 'Failed to save loan' });
    }
  });

  app.put('/api/loans/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await db.update(loans)
        .set({
          outstanding: Number(data.outstanding),
          status: data.status,
        })
        .where(eq(loans.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      console.error('Error updating loan:', error);
      res.status(500).json({ error: 'Failed to update loan' });
    }
  });

  // 7. Loan Payments
  app.get('/api/loan-payments', async (req, res) => {
    try {
      const payments = await db.select().from(loanPayments);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching loan payments:', error);
      res.status(500).json({ error: 'Failed to fetch loan payments' });
    }
  });

  app.post('/api/loan-payments', async (req, res) => {
    try {
      const data = req.body;
      if (!data.loanId || !data.customerId || data.amount === undefined || !data.date || !data.note || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required loan payment fields' });
      }

      let targetId = data.id;

      const allPayments = await db.select().from(loanPayments);
      const existingIds = new Set(allPayments.map(p => p.id));

      if (!targetId || existingIds.has(targetId)) {
        const maxId = allPayments.reduce((max, item) => {
          const match = item.id.match(/^LP-(\d+)$/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        const nextCount = Math.max(allPayments.length, maxId) + 1;
        targetId = 'LP-' + nextCount.toString().padStart(3, '0');

        while (existingIds.has(targetId)) {
          const rand = Math.floor(Math.random() * 1000);
          targetId = `LP-${Date.now()}-${rand}`;
        }
      }

      const inserted = await db.insert(loanPayments)
        .values({
          id: targetId,
          loanId: data.loanId,
          customerId: data.customerId,
          amount: Number(data.amount),
          date: data.date,
          note: data.note,
          createdBy: data.createdBy,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving loan payment:', error);
      res.status(500).json({ error: 'Failed to save loan payment' });
    }
  });

  // 8. Audit Logs
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.id));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const data = req.body;
      if (!data.date || !data.user || !data.role || !data.activity || !data.object || !data.ipAddress) {
        return res.status(400).json({ error: 'Missing required audit log fields' });
      }

      let targetId = data.id;

      // Efficient ID generation using optimized database query
      const alRes = await pool.query(`
        SELECT MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)) as max_val 
        FROM audit_logs 
        WHERE id LIKE 'AL-%'
      `);
      const maxId = alRes.rows[0].max_val || 0;
      
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM audit_logs`);
      const totalCount = parseInt(countRes.rows[0].count, 10);
      
      const nextCount = Math.max(totalCount, maxId) + 1;

      if (!targetId) {
        targetId = 'AL-' + nextCount.toString().padStart(3, '0');
      }

      // Fast collision check
      const checkRes = await pool.query(
        `SELECT id FROM audit_logs WHERE id = $1`,
        [targetId]
      );

      if (checkRes.rows.length > 0) {
        const rand = Math.floor(Math.random() * 1000);
        targetId = `AL-${Date.now()}-${rand}`;
      }

      const inserted = await db.insert(auditLogs)
        .values({
          id: targetId,
          date: data.date,
          user: data.user,
          role: data.role,
          activity: data.activity,
          object: data.object,
          ipAddress: data.ipAddress,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving audit log:', error);
      res.status(500).json({ error: 'Failed to save audit log' });
    }
  });

  // 9. Staff Users
  app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching staff users:', error);
      res.status(500).json({ error: 'Failed to fetch staff users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const data = req.body;
      if (!data.id || !data.name || !data.role) {
        return res.status(400).json({ error: 'Missing required staff user fields' });
      }
      const inserted = await db.insert(users)
        .values({
          id: data.id,
          uid: data.uid || null,
          username: data.username || null,
          name: data.name,
          email: data.email || null,
          role: data.role,
          status: data.status || 'ACTIVE',
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving staff user:', error);
      res.status(500).json({ error: 'Failed to save staff user' });
    }
  });

  // Global Error Handler Middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[Global Error Handler] Caught uncaught error:', err);
    res.status(500).json({
      error: 'Terjadi kesalahan internal pada server.',
      message: err.message || String(err),
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      suggestion: 'Jika ini masalah koneksi database, silakan periksa status database Anda di Supabase atau periksa kembali format DATABASE_URL Anda.'
    });
  });

  // Vite middleware for development or Static Asset serving for production
  async function setupStandaloneServer() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Only listen when running standalone, not in serverless environments like Vercel
  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
    const PORT = 3000;
    setupStandaloneServer().then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  }

export default app;
