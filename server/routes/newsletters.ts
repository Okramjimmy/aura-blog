import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Public: subscribe
router.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }
    const pool = getDb();
    const normalised = email.trim().toLowerCase();

    // Upsert: if email exists and inactive, reactivate; if active, treat as duplicate
    const existing = await pool.query('SELECT * FROM newsletters WHERE email = $1', [normalised]);
    if (existing.rows[0]) {
      if (existing.rows[0].is_active) {
        res.status(409).json({ error: 'This email is already subscribed' });
        return;
      }
      const { rows } = await pool.query(
        'UPDATE newsletters SET is_active = TRUE WHERE email = $1 RETURNING *',
        [normalised]
      );
      res.json({ message: 'Welcome back! Subscription reactivated.', subscriber: rows[0] });
      return;
    }

    const { rows } = await pool.query(
      'INSERT INTO newsletters (id, email) VALUES ($1, $2) RETURNING *',
      [uuidv4(), normalised]
    );
    res.status(201).json({ message: 'Subscribed successfully!', subscriber: rows[0] });
  } catch (err: any) {
    console.error('Subscribe error:', err.message);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// Protected: list subscribers with pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();
    const activeOnly = req.query.active !== 'false';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: any[] = [];
    let pi = 1;

    if (search) {
      conditions.push(`email ILIKE $${pi}`);
      params.push(`%${search}%`);
      pi++;
    }
    if (activeOnly) {
      conditions.push(`is_active = TRUE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM newsletters ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const rows = await pool.query(
      `SELECT * FROM newsletters ${where} ORDER BY created_at ${sortOrder} LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: rows.rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error('Newsletters list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Protected: unsubscribe / delete
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query('DELETE FROM newsletters WHERE id = $1', [req.params.id]);
    if (rowCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
