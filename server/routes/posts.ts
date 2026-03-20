import { Router, Request, Response } from 'express';
import { getDb } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Get all posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows.map(p => ({
      ...p,
      content: JSON.parse(p.content || '[]'),
    })));
  } catch (err: any) {
    console.error('[posts GET /]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get post by slug
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM posts WHERE slug = $1', [req.params.slug]);
    const post = rows[0];
    if (!post) {
      res.status(404).json({ detail: 'Post not found' });
      return;
    }
    res.json({
      ...post,
      content: JSON.parse(post.content || '[]'),
    });
  } catch (err: any) {
    console.error('[posts GET /slug]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get single post
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    const post = rows[0];
    if (!post) {
      res.status(404).json({ detail: 'Post not found' });
      return;
    }
    res.json({
      ...post,
      content: JSON.parse(post.content || '[]'),
    });
  } catch (err: any) {
    console.error('[posts GET /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create post (protected)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getDb();
    const { v4: uuidv4 } = await import('uuid');
    const { title, slug, excerpt, category, content, is_published } = req.body;
    if (!title || !slug) {
      res.status(400).json({ error: 'title and slug are required' });
      return;
    }
    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO posts (id, title, slug, excerpt, category, content, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, title, slug, excerpt ?? '', category ?? 'Journal', JSON.stringify(content ?? []), is_published ?? false],
    );
    const post = rows[0];
    res.status(201).json({ ...post, content: JSON.parse(post.content || '[]') });
  } catch (err: any) {
    console.error('[posts POST /]', err.message);
    res.status(err.code === '23505' ? 409 : 500).json({ error: err.code === '23505' ? 'Slug already exists' : err.message });
  }
});

// Update post (PATCH)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { id } = req.params;
    const { title, content, is_published } = req.body;

    const { rows: existing } = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = existing[0];
    if (!post) {
      res.status(404).json({ detail: 'Post not found' });
      return;
    }

    const newTitle = title !== undefined ? title : post.title;
    const newContent = content !== undefined ? JSON.stringify(content) : post.content;
    const newIsPublished = is_published !== undefined ? is_published : post.is_published;

    await pool.query(
      'UPDATE posts SET title = $1, content = $2, is_published = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [newTitle, newContent, newIsPublished, id]
    );

    const { rows: updated } = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    const updatedPost = updated[0];
    res.json({
      ...updatedPost,
      content: JSON.parse(updatedPost.content || '[]'),
    });
  } catch (err: any) {
    console.error('[posts PATCH /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
