import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  users,
  customers,
  goldPrices,
  moneyTransactions,
  goldTransactions,
  loans,
  loanPayments,
  auditLogs,
} from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

const app = express();
app.use(express.json());

  // API Endpoints for BKS Savings System

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      if (existing.length > 0) {
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
        const inserted = await db.insert(customers)
          .values({
            id: data.id,
            memberNumber: data.memberNumber,
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
    } catch (error) {
      console.error('Error fetching gold prices:', error);
      res.status(500).json({ error: 'Failed to fetch gold prices' });
    }
  });

  app.post('/api/gold-prices', async (req, res) => {
    try {
      const data = req.body;
      if (!data.id || !data.price || !data.date || !data.updatedBy) {
        return res.status(400).json({ error: 'Missing required gold price fields' });
      }
      const inserted = await db.insert(goldPrices)
        .values({
          id: data.id,
          price: Number(data.price),
          date: data.date,
          updatedBy: data.updatedBy,
        })
        .returning();
      res.json(inserted[0]);
    } catch (error) {
      console.error('Error saving gold price:', error);
      res.status(500).json({ error: 'Failed to save gold price' });
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
      if (!data.id || !data.transactionNumber || !data.customerId || !data.type || data.amount === undefined || !data.date || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required money transaction fields' });
      }
      const inserted = await db.insert(moneyTransactions)
        .values({
          id: data.id,
          transactionNumber: data.transactionNumber,
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
      console.error('Error saving money transaction:', error);
      res.status(500).json({ error: 'Failed to save money transaction' });
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
      if (!data.id || !data.transactionNumber || !data.customerId || !data.type || data.weight === undefined || data.goldPriceSnapshot === undefined || data.amountRupiah === undefined || !data.date || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required gold transaction fields' });
      }
      const inserted = await db.insert(goldTransactions)
        .values({
          id: data.id,
          transactionNumber: data.transactionNumber,
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
      if (!data.id || !data.loanNumber || !data.customerId || data.amount === undefined || data.outstanding === undefined || !data.date || !data.note) {
        return res.status(400).json({ error: 'Missing required loan fields' });
      }
      const inserted = await db.insert(loans)
        .values({
          id: data.id,
          loanNumber: data.loanNumber,
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
      if (!data.id || !data.loanId || !data.customerId || data.amount === undefined || !data.date || !data.note || !data.createdBy) {
        return res.status(400).json({ error: 'Missing required loan payment fields' });
      }
      const inserted = await db.insert(loanPayments)
        .values({
          id: data.id,
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
      if (!data.id || !data.date || !data.user || !data.role || !data.activity || !data.object || !data.ipAddress) {
        return res.status(400).json({ error: 'Missing required audit log fields' });
      }
      const inserted = await db.insert(auditLogs)
        .values({
          id: data.id,
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

  // Vite middleware for development or Static Asset serving for production
  async function setupStandaloneServer() {
    if (process.env.NODE_ENV !== 'production') {
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
