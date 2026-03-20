import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const SECRET_KEY = process.env.SECRET_KEY;
  if (!SECRET_KEY) {
    res.status(503).json({ detail: 'SECRET_KEY not configured.' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ detail: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ detail: 'Invalid token' });
  }
};
