import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Menu, Mail, Github, CheckCircle, X, BookOpen, FolderOpen, ArrowRight, Sun, Moon } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.dataset.theme as 'light' | 'dark') || 'light'
  );

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return { theme, toggle };
}

// ─── Types for search ─────────────────────────────────────────────────────────
interface PostResult {
  id: string; title: string; slug: string; excerpt: string;
  category: string; is_published: boolean;
  content: Array<{ type: string; text?: string }>;
}
interface ProjectResult {
  id: string; title: string; category: string;
  description: string; tags: string[]; status: string;
}

// ─── Newsletter form ──────────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/v1/newsletters/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStatus('success');
      setMsg(data.message || 'Subscribed!');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMsg(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-3 text-emerald-600">
        <CheckCircle size={20} />
        <span className="font-medium">{msg}</span>
      </div>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
      <div className="relative flex-grow">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
          placeholder="Your email address"
          className={`w-full pl-12 pr-4 py-3 bg-canvas border rounded-full focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink placeholder:text-ink/40 ${status === 'error' ? 'border-red-400' : 'border-subtle'}`}
          required
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-8 py-3 bg-accent text-canvas rounded-full font-medium hover:bg-accent/90 transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="w-full text-xs text-red-500 mt-1 text-center">{msg}</p>}
    </form>
  );
}

// ─── Global Search Overlay ────────────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [projects, setProjects] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input + load data + Escape handler
  useEffect(() => {
    inputRef.current?.focus();

    Promise.all([
      fetch('/api/v1/posts').then(r => r.json()),
      fetch('/api/v1/projects').then(r => r.json()),
    ]).then(([p, proj]) => {
      setPosts((p as PostResult[]).filter(x => x.is_published));
      setProjects((proj as ProjectResult[]).filter(x => x.status !== 'Draft'));
      setLoading(false);
    }).catch(() => setLoading(false));

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  const q = debounced.toLowerCase().trim();

  const matchedPosts = useMemo(() => {
    if (!q) return [];
    return posts.filter(p => {
      const blocks = Array.isArray(p.content) ? p.content.map(b => b.text ?? '').join(' ') : '';
      return `${p.title} ${p.excerpt ?? ''} ${p.category} ${blocks}`.toLowerCase().includes(q);
    }).slice(0, 6);
  }, [posts, q]);

  const matchedProjects = useMemo(() => {
    if (!q) return [];
    return projects.filter(p => {
      const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
      return `${p.title} ${p.description ?? ''} ${p.category} ${tags}`.toLowerCase().includes(q);
    }).slice(0, 5);
  }, [projects, q]);

  const hasQuery = q.length > 0;
  const hasResults = matchedPosts.length > 0 || matchedProjects.length > 0;

  function go(url: string) {
    onClose();
    navigate(url);
  }

  // Highlight matching text
  function highlight(text: string, maxLen = 80): React.ReactNode {
    const display = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
    if (!q) return display;
    const idx = display.toLowerCase().indexOf(q);
    if (idx === -1) return display;
    return (
      <>
        {display.slice(0, idx)}
        <mark className="bg-accent/20 text-accent rounded px-0.5">{display.slice(idx, idx + q.length)}</mark>
        {display.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(45,41,38,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Search panel */}
      <div
        className="bg-canvas border-b border-subtle shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-5 flex items-center gap-4">
          <Search size={20} className="text-ink/40 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts and projects…"
            className="flex-grow text-lg text-ink bg-transparent focus:outline-none placeholder:text-ink/30"
          />
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Results panel */}
        {hasQuery && (
          <div className="max-w-3xl mx-auto px-4 md:px-8 pb-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>

            {/* Loading */}
            {loading && (
              <div className="py-6 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-subtle rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && !hasResults && (
              <div className="py-8 text-center">
                <p className="text-ink/50 font-light">No results for <strong className="text-ink">"{debounced}"</strong></p>
                <p className="text-xs text-ink/30 mt-1">Try a different keyword or browse by category</p>
              </div>
            )}

            {/* Post results */}
            {!loading && matchedPosts.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-subtle">
                  <BookOpen size={12} className="text-ink/40" />
                  <span className="text-xs uppercase tracking-widest text-ink/40 font-medium">Journal</span>
                  <span className="text-xs text-ink/30 ml-auto">{matchedPosts.length} result{matchedPosts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-0.5">
                  {matchedPosts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => go(`/blog/${p.slug}`)}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-subtle/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent flex-shrink-0">
                          {p.category}
                        </span>
                        <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors truncate">
                          {highlight(p.title)}
                        </span>
                        <ArrowRight size={13} className="text-ink/20 group-hover:text-accent transition-colors flex-shrink-0 ml-auto" />
                      </div>
                      {p.excerpt && (
                        <p className="text-xs text-ink/45 pl-0.5 line-clamp-1 mt-0.5">
                          {highlight(p.excerpt)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project results */}
            {!loading && matchedProjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-subtle">
                  <FolderOpen size={12} className="text-ink/40" />
                  <span className="text-xs uppercase tracking-widest text-ink/40 font-medium">Projects</span>
                  <span className="text-xs text-ink/30 ml-auto">{matchedProjects.length} result{matchedProjects.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-0.5">
                  {matchedProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => go(`/projects/${p.id}`)}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-subtle/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-subtle text-ink/60 flex-shrink-0">
                          {p.category}
                        </span>
                        <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors truncate">
                          {highlight(p.title)}
                        </span>
                        {p.status && p.status !== 'Draft' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-auto ${
                            p.status === 'Live' ? 'bg-emerald-50 text-emerald-600' : 'bg-subtle text-ink/50'
                          }`}>
                            {p.status}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-ink/45 pl-0.5 line-clamp-1 mt-0.5">
                          {highlight(p.description)}
                        </p>
                      )}
                      {Array.isArray(p.tags) && p.tags.length > 0 && (
                        <div className="flex gap-1 pl-0.5 mt-1.5 flex-wrap">
                          {p.tags.slice(0, 4).map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 bg-subtle/70 rounded text-ink/50">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse hint when no query */}
            {!loading && hasResults && (
              <p className="text-xs text-ink/30 text-center mt-5 pb-1">
                Press <kbd className="px-1.5 py-0.5 bg-subtle rounded text-ink/50 font-mono text-xs">Esc</kbd> to close
              </p>
            )}
          </div>
        )}

        {/* Empty state when overlay just opened */}
        {!hasQuery && (
          <div className="max-w-3xl mx-auto px-4 md:px-8 pb-6">
            <p className="text-xs text-ink/30 uppercase tracking-widest mb-4">Quick links</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Journal', to: '/blog' },
                { label: 'Projects', to: '/projects' },
                { label: 'GitHub', to: '/github' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(l => (
                <button
                  key={l.to}
                  onClick={() => go(l.to)}
                  className="px-4 py-2 bg-surface border border-subtle rounded-full text-sm text-ink/70 hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click-away area */}
      <div className="flex-grow" onClick={onClose} />
    </div>
  );
}

// ─── Mobile Menu Drawer ───────────────────────────────────────────────────────
function MobileMenu({ onClose, theme, onToggleTheme }: {
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const navLinks = [
    { label: 'About', to: '/about' },
    { label: 'Projects', to: '/projects' },
    { label: 'Journal', to: '/blog' },
    { label: 'GitHub', to: '/github' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Drawer panel */}
      <div className="w-72 max-w-[80vw] bg-canvas border-r border-subtle flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-subtle">
          <span className="text-2xl font-serif font-semibold text-ink">Aura.</span>
          <button onClick={onClose} className="text-ink/50 hover:text-ink transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-4 py-6 gap-1 flex-grow">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink/80 hover:text-accent hover:bg-subtle/60 transition-colors font-medium text-sm uppercase tracking-wide"
            >
              {l.label === 'GitHub' && <Github size={15} className="text-ink/40" />}
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: theme toggle + subscribe */}
        <div className="px-6 pb-8 border-t border-subtle pt-5 space-y-4">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-subtle/50 hover:bg-subtle transition-colors text-sm font-medium text-ink/80"
          >
            {theme === 'dark' ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-accent" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <a
            href="#subscribe"
            onClick={onClose}
            className="flex items-center justify-center px-5 py-3 text-sm font-medium text-canvas bg-accent hover:bg-accent/90 transition-colors rounded-full"
          >
            Subscribe
          </a>
        </div>
      </div>

      {/* Backdrop */}
      <div className="flex-grow" onClick={onClose} style={{ backgroundColor: 'rgba(45,41,38,0.4)', backdropFilter: 'blur(2px)' }} />
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-subtle py-6 px-4 md:px-8 lg:px-12 flex justify-between items-center sticky top-0 bg-canvas/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-ink hover:text-accent transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <nav className="hidden md:flex gap-6 text-sm font-medium tracking-wide uppercase text-ink/80">
            <Link to="/about" className="hover:text-accent transition-colors">About</Link>
            <Link to="/projects" className="hover:text-accent transition-colors">Projects</Link>
            <Link to="/blog" className="hover:text-accent transition-colors">Journal</Link>
            <Link to="/github" className="hover:text-accent transition-colors flex items-center gap-1.5">
              <Github size={14} />GitHub
            </Link>
            <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-ink">
          <Link to="/">Aura.</Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="hidden md:flex text-ink/60 hover:text-accent transition-colors p-1"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="text-ink hover:text-accent transition-colors"
            aria-label="Open search"
          >
            <Search size={20} />
          </button>
          <a
            href="#subscribe"
            className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-canvas bg-accent hover:bg-accent/90 transition-colors rounded-full"
          >
            Subscribe
          </a>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <MobileMenu
          onClose={() => setMobileOpen(false)}
          theme={theme}
          onToggleTheme={() => { toggleTheme(); }}
        />
      )}

      {/* Global search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-subtle bg-surface/30 pt-16 pb-8 px-4 md:px-8 lg:px-12 mt-12" id="subscribe">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-ink">Letters on Simplicity</h2>
          <p className="text-ink/70 mb-8 max-w-xl mx-auto font-light leading-relaxed">
            Join 12,000+ readers receiving my bi-weekly newsletter. Essays on design, slow living, and finding clarity in the modern world.
          </p>
          <NewsletterForm />
          <p className="text-xs text-ink/40 mt-4">No spam. Unsubscribe at any time.</p>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-subtle gap-4">
          <div className="text-2xl font-serif font-semibold text-ink">Aura.</div>
          <div className="text-sm text-ink/50 font-light">
            &copy; {new Date().getFullYear()} Aura Blog. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-ink/60 font-light">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
