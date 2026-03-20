import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Get all projects (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC');
    res.json(rows.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })));
  } catch (err: any) {
    console.error('[projects GET /]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get single project (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    const project = rows[0];
    if (!project) { res.status(404).json({ detail: 'Project not found' }); return; }
    res.json({ ...project, tags: JSON.parse(project.tags || '[]') });
  } catch (err: any) {
    console.error('[projects GET /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create project (protected)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getDb();
    const { title, category, description, tags, status, image_seed, sort_order } = req.body;
    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO projects (id, title, category, description, tags, status, image_seed, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, title, category || 'Engineering', description || '', JSON.stringify(tags || []), status || 'Draft', image_seed || '', sort_order || 0]
    );
    const project = rows[0];
    res.status(201).json({ ...project, tags: JSON.parse(project.tags || '[]') });
  } catch (err: any) {
    console.error('[projects POST /]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update project (protected)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { id } = req.params;
    const { rows: existing } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    const project = existing[0];
    if (!project) { res.status(404).json({ detail: 'Project not found' }); return; }

    const updates = {
      title: req.body.title ?? project.title,
      category: req.body.category ?? project.category,
      description: req.body.description ?? project.description,
      tags: req.body.tags !== undefined ? JSON.stringify(req.body.tags) : project.tags,
      status: req.body.status ?? project.status,
      image_seed: req.body.image_seed ?? project.image_seed,
      sort_order: req.body.sort_order ?? project.sort_order,
    };

    const { rows: updated } = await pool.query(
      `UPDATE projects SET title=$1, category=$2, description=$3, tags=$4, status=$5, image_seed=$6, sort_order=$7 WHERE id=$8 RETURNING *`,
      [updates.title, updates.category, updates.description, updates.tags, updates.status, updates.image_seed, updates.sort_order, id]
    );
    const p = updated[0];
    res.json({ ...p, tags: JSON.parse(p.tags || '[]') });
  } catch (err: any) {
    console.error('[projects PATCH /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete project (protected)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    if (rowCount === 0) { res.status(404).json({ detail: 'Project not found' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[projects DELETE /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
