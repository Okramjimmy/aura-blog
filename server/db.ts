import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getDb(): pg.Pool {
  if (poolInstance) return poolInstance;

  poolInstance = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    database: process.env.DB_NAME     || 'blog',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD,
    port:     parseInt(process.env.DB_PORT || '5432', 10),
  });

  return poolInstance;
}

export async function initDb() {
  const pool = getDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT UNIQUE,
      excerpt TEXT,
      category TEXT DEFAULT 'Journal',
      content TEXT,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add columns if they don't exist (for existing installs)
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt TEXT`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Journal'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Engineering',
      description TEXT,
      tags TEXT,
      status TEXT DEFAULT 'Live',
      image_seed TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT DEFAULT '',
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletters (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      path TEXT NOT NULL,
      visitor_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as count FROM posts');
  if (parseInt(rows[0].count) === 0) {
    await seedPosts(pool);
  }

  const { rows: projRows } = await pool.query('SELECT COUNT(*) as count FROM projects');
  if (parseInt(projRows[0].count) === 0) {
    await seedProjects(pool);
  }
}

async function seedPosts(pool: pg.Pool) {
  const posts = [
    {
      id: uuidv4(),
      title: 'Building This Blog: From Idea to Deployment',
      slug: 'building-this-blog',
      excerpt: 'A transparent look at the decisions, tools, and trade-offs behind building a personal publishing platform from scratch — and what I learned along the way.',
      category: 'Engineering',
      content: JSON.stringify([
        { type: 'h1', text: 'Building This Blog: From Idea to Deployment' },
        { type: 'paragraph', text: 'A transparent look at the decisions, tools, and trade-offs behind building a personal publishing platform from scratch — and what I learned along the way.' },
        { type: 'h2', text: 'Why Build When You Can Buy?' },
        { type: 'paragraph', text: 'Ghost, Substack, WordPress — the landscape of publishing tools is vast. But none of them felt quite right. I wanted full control over the reading experience, the ability to embed interactive components, and the satisfaction of owning every line of code. So I built my own.' },
        { type: 'h2', text: 'The Stack' },
        { type: 'paragraph', text: 'React 19 handles the frontend with React Router for navigation. The backend is a lightweight Express server with a PostgreSQL database. Tailwind CSS v4 powers the styling, using CSS variables as design tokens rather than a config file. The result is a system that is fast to iterate on and easy to reason about.' },
        { type: 'h2', text: 'The CMS' },
        { type: 'paragraph', text: 'The admin panel is a custom-built CMS with a block-based editor. Content is stored as a JSON array of typed blocks — headings, paragraphs, blockquotes, images. This makes it trivial to render content with precise typographic control, and easy to migrate or transform later.' },
        { type: 'h2', text: 'Deployment' },
        { type: 'paragraph', text: 'The server runs on a single VPS. Vite handles the production build, and Express serves the static files. No containers, no orchestration — just a simple process that is easy to reason about and restart. Boring infrastructure is good infrastructure.' },
        { type: 'paragraph', text: 'The project is ongoing. Next up: full-text search, an RSS feed, and a more capable editor with image uploads. Building in public means shipping imperfect things — and that is the point.' },
      ]),
      is_published: true,
      created_at: '2025-11-10T09:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'On Leaving Social Media (And What I Found in the Silence)',
      slug: 'leaving-social-media',
      excerpt: 'Eighteen months after deleting my last social media account, I have thoughts on boredom, attention, and what actually matters.',
      category: 'Journal',
      content: JSON.stringify([
        { type: 'h1', text: 'On Leaving Social Media (And What I Found in the Silence)' },
        { type: 'paragraph', text: 'Eighteen months after deleting my last social media account, I have thoughts on boredom, attention, and what actually matters.' },
        { type: 'h2', text: 'The Decision' },
        { type: 'paragraph', text: 'It was not a grand gesture. I did not write a farewell post or explain myself. I simply stopped opening the apps, then deleted them, then deleted the accounts. The process took about ten minutes and caused no drama whatsoever, which itself said something.' },
        { type: 'h2', text: 'The First Month' },
        { type: 'paragraph', text: 'The phantom phone checks were real. My thumb would reach for an app that was no longer there, then float awkwardly before I put the phone down. I had more time — but I did not know what to do with it at first. This is not a problem most people acknowledge: we are so accustomed to filling every gap that genuine unstructured time feels threatening.' },
        { type: 'h2', text: 'What Came Back' },
        { type: 'paragraph', text: 'Reading long-form. Finishing books. Sitting with a problem for more than ninety seconds before reaching for distraction. A quality of attention that I had not noticed I had lost. I started writing again — not for an audience, just for the practice of thinking clearly.' },
        { type: 'h2', text: 'What I Miss' },
        { type: 'paragraph', text: 'Genuinely: occasional good posts from people I respect, and the low-friction way social networks let you stay loosely connected to a large number of people. These are real costs. I have replaced them imperfectly with email, RSS, and the occasional phone call.' },
        { type: 'paragraph', text: 'The net is strongly positive. I recommend the experiment, even if only for a month.' },
      ]),
      is_published: true,
      created_at: '2025-12-01T10:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'Designing for Yourself First',
      slug: 'designing-for-yourself-first',
      excerpt: 'The best creative work I have done started with a simple question: what would I actually want to use? A case against audience-first thinking in personal projects.',
      category: 'Design',
      content: JSON.stringify([
        { type: 'h1', text: 'Designing for Yourself First' },
        { type: 'paragraph', text: 'The best creative work I have done started with a simple question: what would I actually want to use? A case against audience-first thinking in personal projects.' },
        { type: 'h2', text: 'The Trap of Imagined Users' },
        { type: 'paragraph', text: 'Most design advice focuses on the user. Understand their needs, build empathy, remove friction. This is correct in a professional context — you are solving someone else\'s problem. But personal projects are different. When you are the primary user, second-guessing your own taste is a form of self-erasure.' },
        { type: 'h2', text: 'Taste as a Tool' },
        { type: 'paragraph', text: 'Strong personal taste is an asset, not a liability. It gives you a clear criterion for decisions: does this feel right to me? This speeds up the design process enormously. You do not need to justify every choice to a committee. You just need to be honest with yourself.' },
        { type: 'h2', text: 'The Feedback Loop' },
        { type: 'paragraph', text: 'When you build things you actually use, you notice problems faster. This blog is a good example. I write in the editor every day, which means I find friction immediately and fix it. No user research needed — I am the research.' },
        { type: 'h2', text: 'When This Breaks Down' },
        { type: 'paragraph', text: 'This approach has limits. If your taste is unusual, your work may not resonate broadly. If you are not your target user, it breaks completely. The key is honesty about which situation you are in. Personal projects can afford to be personal. Products cannot.' },
      ]),
      is_published: true,
      created_at: '2026-01-08T08:30:00Z',
    },
    {
      id: uuidv4(),
      title: 'The Case for Boring Technology',
      slug: 'boring-technology',
      excerpt: 'Chasing new frameworks and shiny tools is easy. Shipping reliable, maintainable software is hard. A reflection on why the most experienced engineers I know reach for the dullest solutions.',
      category: 'Engineering',
      content: JSON.stringify([
        { type: 'h1', text: 'The Case for Boring Technology' },
        { type: 'paragraph', text: 'Chasing new frameworks and shiny tools is easy. Shipping reliable, maintainable software is hard. A reflection on why the most experienced engineers I know reach for the dullest solutions.' },
        { type: 'h2', text: 'The Novelty Tax' },
        { type: 'paragraph', text: 'Every new technology carries a novelty tax: immature documentation, unknown failure modes, a small community, and the cognitive overhead of learning. These costs are paid upfront and continuously. Boring technology has already paid them. Its failure modes are documented. The solutions are on Stack Overflow. The senior hire you bring on already knows it.' },
        { type: 'h2', text: 'Boring Is Not the Same as Simple' },
        { type: 'paragraph', text: 'PostgreSQL is boring. It is also extraordinarily powerful, deeply reliable, and a genuine pleasure to work with once you know it. The same is true of Linux, HTTP, and plain SQL. Boring technology is often boring precisely because it has been refined for decades. That refinement is a feature.' },
        { type: 'h2', text: 'When to Choose Something New' },
        { type: 'paragraph', text: 'There are legitimate reasons to adopt new technology: it solves a problem that cannot be solved otherwise, the team has deep expertise in it, or it is genuinely the right tool. The problem is that these conditions are rarer than the enthusiasm for new things would suggest. Most of the time, you are reaching for the new because it is interesting, not because it is right.' },
        { type: 'paragraph', text: 'This blog runs on Express, PostgreSQL, and React. All of them are boring. All of them work.' },
      ]),
      is_published: true,
      created_at: '2026-02-14T11:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'Reading Notes: January & February 2026',
      slug: 'reading-notes-jan-feb-2026',
      excerpt: 'A handful of books that shaped my thinking this winter — on work, attention, and the structure of the physical world.',
      category: 'Journal',
      content: JSON.stringify([
        { type: 'h1', text: 'Reading Notes: January & February 2026' },
        { type: 'paragraph', text: 'A handful of books that shaped my thinking this winter — on work, attention, and the structure of the physical world.' },
        { type: 'h2', text: 'A World Without Email — Cal Newport' },
        { type: 'paragraph', text: 'Newport\'s argument is structural: the problem with email and chat tools is not the volume of messages but the workflow model they impose. Constant, unscheduled communication fragments attention into unusable slivers. His alternative is to move toward role-based, asynchronous workflows. Practical and well-evidenced, though the prescriptions require organizational buy-in that individuals rarely have.' },
        { type: 'h2', text: 'The Timeless Way of Building — Christopher Alexander' },
        { type: 'paragraph', text: 'A strange and beautiful book about how living structures — buildings, towns, rooms — acquire a quality that has no name except that you recognize it immediately. Alexander\'s central claim is that this quality cannot be produced by following rules; it emerges from a process of careful, iterative repair. The architectural thinking maps surprisingly well onto software design.' },
        { type: 'h2', text: 'The Road to Wigan Pier — George Orwell' },
        { type: 'paragraph', text: 'Re-reading Orwell is always instructive. His prose is a masterclass in clarity: short sentences, concrete nouns, zero abstraction when description will do. The first half, which documents working-class life in the industrial north of England, is reportage of the highest order. The second half is Orwell arguing with himself about socialism, which is less successful but more interesting.' },
        { type: 'paragraph', text: 'Currently working through Anna Karenina, slowly. It demands the kind of sustained attention I am trying to rebuild.' },
      ]),
      is_published: true,
      created_at: '2026-03-01T09:00:00Z',
    },
  ];

  for (const post of posts) {
    await pool.query(
      `INSERT INTO posts (id, title, slug, excerpt, category, content, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [post.id, post.title, post.slug, post.excerpt, post.category, post.content, post.is_published, post.created_at]
    );
  }
}

async function seedProjects(pool: pg.Pool) {
  const projects = [
    {
      id: uuidv4(),
      title: 'Organic Minimalism Blog',
      category: 'Engineering',
      description: 'This site. A custom CMS and blog built with React, Express, and PostgreSQL. Features a block-based editor, JWT-authenticated admin panel, and a clean reading experience designed from scratch.',
      tags: JSON.stringify(['React', 'TypeScript', 'PostgreSQL', 'Express']),
      status: 'Live',
      image_seed: 'blog-cms',
      sort_order: 1,
    },
    {
      id: uuidv4(),
      title: 'Readwise CLI Companion',
      category: 'Engineering',
      description: 'A command-line tool that pulls highlights from Readwise and formats them into a daily review digest. Supports Markdown export, filtered queries by tag and date, and a plain-text output mode for terminal readers.',
      tags: JSON.stringify(['Node.js', 'TypeScript', 'REST API', 'CLI']),
      status: 'Open Source',
      image_seed: 'terminal-tool',
      sort_order: 2,
    },
    {
      id: uuidv4(),
      title: 'Personal Type System',
      category: 'Design',
      description: 'A personal typographic system exploring the pairing of Cormorant Garamond with Inter across editorial contexts. Includes scale specimens, line-length studies, and a contrast grid for light and dark surfaces.',
      tags: JSON.stringify(['Typography', 'Figma', 'CSS']),
      status: 'Ongoing',
      image_seed: 'typography-specimen',
      sort_order: 3,
    },
    {
      id: uuidv4(),
      title: 'PostgreSQL Backup Monitor',
      category: 'Engineering',
      description: 'A self-hosted service that verifies nightly PostgreSQL backups are completing successfully and sends a daily digest. Built after a silent backup failure left a production database unprotected for two weeks.',
      tags: JSON.stringify(['Node.js', 'PostgreSQL', 'Cron', 'SMTP']),
      status: 'Open Source',
      image_seed: 'server-infra',
      sort_order: 4,
    },
    {
      id: uuidv4(),
      title: 'Focus Mode — Browser Extension',
      category: 'UX/UI',
      description: 'A minimal browser extension that dims non-essential page elements and strips tracking parameters from URLs. Designed around a single principle: the web should serve the reader, not the other way around.',
      tags: JSON.stringify(['JavaScript', 'Browser Extension', 'CSS']),
      status: 'Live',
      image_seed: 'browser-ext',
      sort_order: 5,
    },
    {
      id: uuidv4(),
      title: 'Color in Interface Design',
      category: 'Design',
      description: 'A research project studying how restrained color palettes affect user attention and perceived quality in web interfaces. Includes annotated case studies of six published products and a set of decision heuristics.',
      tags: JSON.stringify(['UX Research', 'Color Theory', 'Figma']),
      status: 'Complete',
      image_seed: 'color-study',
      sort_order: 6,
    },
  ];

  for (const project of projects) {
    await pool.query(
      `INSERT INTO projects (id, title, category, description, tags, status, image_seed, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [project.id, project.title, project.category, project.description, project.tags, project.status, project.image_seed, project.sort_order]
    );
  }
}
