import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Public: submit contact form
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }
    const pool = getDb();
    const { rows } = await pool.query(
      `INSERT INTO contacts (id, name, email, subject, message)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uuidv4(), name.trim(), email.trim().toLowerCase(), subject?.trim() || '', message.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Contact submit error:', err.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Protected: list contacts with pagination, sorting, filtering
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();
    const sortField = ['name','email','subject','created_at','is_read'].includes(req.query.sort as string)
      ? req.query.sort as string : 'created_at';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const unreadOnly = req.query.unread === 'true';

    const conditions: string[] = [];
    const params: any[] = [];
    let pi = 1;

    if (search) {
      conditions.push(`(name ILIKE $${pi} OR email ILIKE $${pi} OR subject ILIKE $${pi} OR message ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (unreadOnly) {
      conditions.push(`is_read = FALSE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM contacts ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const rows = await pool.query(
      `SELECT * FROM contacts ${where} ORDER BY ${sortField} ${sortOrder} LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: rows.rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error('Contacts list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Protected: mark as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      'UPDATE contacts SET is_read = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: delete
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    if (rowCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
