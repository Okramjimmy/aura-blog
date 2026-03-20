import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const SECRET_KEY     = process.env.SECRET_KEY;
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!SECRET_KEY) {
    res.status(503).json({ detail: 'SECRET_KEY not configured.' });
    return;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    res.status(503).json({ detail: 'Admin credentials not configured.' });
    return;
  }

  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ sub: email, role: 'admin' }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ access_token: token });
  } else {
    res.status(401).json({ detail: 'Invalid credentials' });
  }
});

export default router;
