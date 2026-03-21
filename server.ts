import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' }); // local dev — takes priority
loadEnv();                        // .env — production fallback
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { initDb } from './server/db.ts';
import authRoutes from './server/routes/auth.ts';
import postRoutes from './server/routes/posts.ts';
import projectRoutes from './server/routes/projects.ts';
import statsRoutes from './server/routes/stats.ts';
import contactRoutes from './server/routes/contacts.ts';
import newsletterRoutes from './server/routes/newsletters.ts';
import githubRoutes from './server/routes/github.ts';
import pageviewRoutes from './server/routes/pageview.ts';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize PostgreSQL Database
  await initDb();

  // --- Force JSON content-type for ALL /api responses ---
  // This runs before any route handler and ensures that even if
  // something goes wrong downstream, browsers/fetch see application/json.
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Override res.send so that if Vite or any middleware accidentally
    // sends HTML for an /api path, we catch it.
    const originalSend = res.send.bind(res);
    res.send = function (body: any) {
      // If content-type hasn't been set to json and this is an /api route,
      // force it. This is a safety net.
      if (!res.headersSent) {
        const ct = res.getHeader('content-type');
        if (!ct || (typeof ct === 'string' && ct.includes('text/html'))) {
          res.setHeader('content-type', 'application/json');
        }
      }
      return originalSend(body);
    };
    next();
  });

  // --- API Routes ---
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/posts', postRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/stats', statsRoutes);
  app.use('/api/v1/contacts', contactRoutes);
  app.use('/api/v1/newsletters', newsletterRoutes);
  app.use('/api/v1/github', githubRoutes);
  app.use('/api/v1/pageview', pageviewRoutes);

  // --- Catch-all for unknown /api routes — return 404 JSON, not HTML ---
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- API error handler — must come before Vite middleware ---
  // Express requires exactly 4 args to treat this as an error handler.
  app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]', err?.message || err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    }
  });

  // --- Vite Middleware (frontend only — must come AFTER api routes) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',  // NOT 'spa' — 'spa' adds connect-history-api-fallback which steals /api routes
    });
    // Use Vite's connect middleware for HMR, module serving, etc.
    app.use(vite.middlewares);

    // SPA fallback: only for non-API, non-file requests
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      // Never serve HTML for /api paths
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const html = await vite.transformIndexHtml(
          req.originalUrl,
          (await import('fs')).readFileSync(path.resolve('index.html'), 'utf-8')
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ error: 'API route not found' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
