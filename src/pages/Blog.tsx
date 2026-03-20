import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Block { type: string; text?: string; }
interface Post {
  id: string; title: string; slug: string; excerpt: string;
  category: string; created_at: string; is_published: boolean;
  content: Block[];
}
type View = 'list' | 'grid';

// ─── Constants ────────────────────────────────────────────────────────────────
const PER_PAGE = 6;

const SEEDS: Record<string, string> = {
  Engineering: 'code-desk', Design: 'design-studio',
  Journal: 'journal-light', Essay: 'essay-writing', default: 'minimal-room',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function imgUrl(post: Post) {
  const seed = SEEDS[post.category] ?? SEEDS.default;
  return `https://picsum.photos/seed/${seed}-${post.id.slice(0, 8)}/800/600`;
}

function postFullText(post: Post): string {
  const blocks = Array.isArray(post.content) ? post.content.map(b => b.text ?? '').join(' ') : '';
  return `${post.title} ${post.excerpt ?? ''} ${post.category} ${blocks}`.toLowerCase();
}

function pageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  if (current > 3) out.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="aspect-[4/3] bg-subtle rounded-xl" />
          <div className="h-3 bg-subtle rounded w-1/3" />
          <div className="h-5 bg-subtle rounded w-5/6" />
          <div className="h-4 bg-subtle rounded w-full" />
          <div className="h-4 bg-subtle rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-14">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-pulse">
          <div className="aspect-[4/3] bg-subtle rounded-xl" />
          <div className="space-y-4">
            <div className="h-3 bg-subtle rounded w-1/4" />
            <div className="h-8 bg-subtle rounded w-5/6" />
            <div className="h-4 bg-subtle rounded w-full" />
            <div className="h-4 bg-subtle rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({ post }: { post: Post }) {
  return (
    <article className="group flex flex-col">
      <Link to={`/blog/${post.slug}`} className="block aspect-[4/3] overflow-hidden rounded-xl mb-4 flex-shrink-0">
        <img
          src={imgUrl(post)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </Link>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-medium uppercase tracking-widest text-accent">{post.category}</span>
        <span className="text-ink/30 text-xs">·</span>
        <span className="text-xs text-ink/50">{formatDate(post.created_at)}</span>
      </div>
      <h3 className="font-serif text-xl text-ink mb-2.5 leading-snug group-hover:text-accent transition-colors">
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className="text-sm text-ink/60 font-light leading-relaxed line-clamp-2 mb-4 flex-grow">
        {post.excerpt}
      </p>
      <Link
        to={`/blog/${post.slug}`}
        className="text-xs font-medium uppercase tracking-widest text-ink/50 hover:text-accent transition-colors self-start"
      >
        Read More
      </Link>
    </article>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ post }: { post: Post }) {
  return (
    <article className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <Link to={`/blog/${post.slug}`} className="block aspect-[4/3] overflow-hidden rounded-xl">
        <img
          src={imgUrl(post)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </Link>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium uppercase tracking-widest text-accent">{post.category}</span>
          <span className="text-xs text-ink/40">·</span>
          <span className="text-xs font-medium uppercase tracking-widest text-ink/50">{formatDate(post.created_at)}</span>
        </div>
        <h3 className="text-3xl font-serif text-ink mb-4 leading-snug group-hover:text-accent transition-colors">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-ink/70 mb-6 leading-relaxed font-light line-clamp-3">{post.excerpt}</p>
        <Link
          to={`/blog/${post.slug}`}
          className="text-sm font-medium text-ink hover:text-accent transition-colors uppercase tracking-widest"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  current, total, onChange,
}: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} /> Prev
      </button>

      {pageNums(current, total).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-9 text-center text-sm text-ink/30 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === current ? 'bg-ink text-canvas' : 'text-ink/60 hover:text-ink hover:bg-subtle'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(() =>
    (localStorage.getItem('blog_view') as View) ?? 'list',
  );
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/v1/posts')
      .then(r => r.json())
      .then((data: Post[]) => setPosts(data.filter(p => p.is_published)))
      .finally(() => setLoading(false));
  }, []);

  // Debounce search input → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when category changes
  useEffect(() => { setPage(1); }, [category]);

  function changeView(v: View) {
    setView(v);
    localStorage.setItem('blog_view', v);
  }

  function clearFilters() {
    setSearch('');
    setCategory('All');
  }

  // Derived categories from actual data
  const categories = useMemo(() => {
    const cats = [...new Set(posts.map(p => p.category))].sort();
    return ['All', ...cats];
  }, [posts]);

  // Filter by category + debounced search
  const filtered = useMemo(() => {
    let list = posts;
    if (category !== 'All') list = list.filter(p => p.category === category);
    if (debounced.trim()) {
      const q = debounced.toLowerCase();
      list = list.filter(p => postFullText(p).includes(q));
    }
    return list;
  }, [posts, category, debounced]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const isFiltered = debounced.trim() !== '' || category !== 'All';

  function handlePageChange(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div ref={topRef} className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-6xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <p className="text-sm uppercase tracking-widest text-accent font-medium mb-3">Writing</p>
        <h1 className="text-5xl md:text-6xl font-serif text-ink mb-4">Journal</h1>
        <p className="text-lg text-ink/60 font-light max-w-xl mx-auto">
          Essays on design, engineering, and living with intention.
        </p>
      </div>

      {/* ── Controls Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-9 py-2.5 bg-surface border border-subtle rounded-xl text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-subtle rounded-lg p-0.5 bg-surface flex-shrink-0">
          <button
            onClick={() => changeView('list')}
            title="List view"
            className={`p-2 rounded-md transition-colors ${
              view === 'list' ? 'bg-ink text-canvas' : 'text-ink/40 hover:text-ink'
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => changeView('grid')}
            title="Grid view"
            className={`p-2 rounded-md transition-colors ${
              view === 'grid' ? 'bg-ink text-canvas' : 'text-ink/40 hover:text-ink'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* ── Category Chips ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(loading ? ['All', 'Engineering', 'Journal', 'Design'] : categories).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-ink text-canvas'
                : 'bg-surface border border-subtle text-ink/60 hover:text-ink hover:border-ink/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Results meta ─────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between mb-6 min-h-[20px]">
          <p className="text-xs text-ink/40 uppercase tracking-widest">
            {filtered.length === 0
              ? 'No posts found'
              : `${filtered.length} post${filtered.length !== 1 ? 's' : ''}${isFiltered ? ' · filtered' : ''}`}
          </p>
          {isFiltered && (
            <button onClick={clearFilters} className="text-xs text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading && (view === 'grid' ? <GridSkeleton /> : <ListSkeleton />)}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-5xl mb-5">✍️</div>
          <p className="text-lg font-serif text-ink/60 mb-2">
            {debounced ? `Nothing matching "${debounced}"` : 'No posts in this category yet.'}
          </p>
          {isFiltered && (
            <button onClick={clearFilters} className="text-sm text-accent hover:underline mt-2">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────────────── */}
      {!loading && visible.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map(post => (
            <React.Fragment key={post.id}>
              <GridCard post={post} />
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── List view ────────────────────────────────────────────────────────── */}
      {!loading && visible.length > 0 && view === 'list' && (
        <div className="space-y-14">
          {visible.map(post => (
            <React.Fragment key={post.id}>
              <ListRow post={post} />
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <p className="text-xs text-ink/40">
            Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <Pagination current={safePage} total={totalPages} onChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
