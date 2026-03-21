import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { getDb } from '../db.ts';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'path required' });
      return;
    }

    // Hash IP + user-agent to approximate unique visitors without storing PII
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';
    const ua = req.headers['user-agent'] || '';
    const visitor_hash = createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);

    const pool = getDb();
    await pool.query(
      `INSERT INTO page_views (path, visitor_hash) VALUES ($1, $2)`,
      [path.slice(0, 255), visitor_hash]
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[pageview]', err.message);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

export default router;
