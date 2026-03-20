import { Router, Request, Response } from 'express';
import { getDb } from '../db.ts';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getDb();

    const [postsR, projectsR, recentPostsR, recentProjectsR, contactsR, newslettersR] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN is_published THEN 1 ELSE 0 END) AS published,
          SUM(CASE WHEN NOT is_published THEN 1 ELSE 0 END) AS draft
        FROM posts
      `),
      pool.query(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN status IN ('Live','Open Source','Complete') THEN 1 ELSE 0 END) AS published,
          SUM(CASE WHEN status IN ('Draft','Ongoing') THEN 1 ELSE 0 END) AS draft
        FROM projects
      `),
      pool.query(`SELECT id, title, slug, category, is_published, created_at FROM posts ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT id, title, category, status, created_at FROM projects ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) AS unread FROM contacts`),
      pool.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active FROM newsletters`),
    ]);

    const p = postsR.rows[0];
    const pr = projectsR.rows[0];
    const c = contactsR.rows[0];
    const n = newslettersR.rows[0];

    res.json({
      posts: {
        total: parseInt(p.total) || 0,
        published: parseInt(p.published) || 0,
        draft: parseInt(p.draft) || 0,
      },
      projects: {
        total: parseInt(pr.total) || 0,
        published: parseInt(pr.published) || 0,
        draft: parseInt(pr.draft) || 0,
      },
      contacts: {
        total: parseInt(c.total) || 0,
        unread: parseInt(c.unread) || 0,
      },
      newsletters: {
        total: parseInt(n.total) || 0,
        active: parseInt(n.active) || 0,
      },
      recent_posts: recentPostsR.rows,
      recent_projects: recentProjectsR.rows,
    });
  } catch (err: any) {
    console.error('[stats]', err.message);
    res.status(500).json({ error: err.message || 'Failed to load stats' });
  }
});

export default router;
