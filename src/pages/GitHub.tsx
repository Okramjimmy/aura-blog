import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Star, GitFork, ExternalLink, Clock, BookOpen,
  RefreshCw, AlertCircle, Github, Filter, Search,
} from 'lucide-react';
import { apiJson } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  login: string; name: string; bio: string; avatar_url: string; html_url: string;
  public_repos: number; followers: number; following: number;
  location: string; blog: string; created_at: string;
}
interface Repo {
  id: number; name: string; full_name: string; description: string;
  html_url: string; language: string; stargazers_count: number;
  forks_count: number; topics: string[]; updated_at: string;
}
interface GithubData {
  profile: Profile; repos: Repo[]; highlights: Repo[];
  languages: string[]; total_repos: number; cached: boolean; rate_limit_remaining: number;
}
interface ContribDay { date: string; contributionCount: number; }
interface ContribWeek { contributionDays: ContribDay[]; }
interface ContribCalendar { totalContributions: number; weeks: ContribWeek[]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
}

const LANG_DOT: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8',
  Rust: '#dea584', Shell: '#89e051', Dockerfile: '#384d54',
};

// ─── Contribution Heatmap ─────────────────────────────────────────────────────
const CELL = 11;
const GAP = 3;
const CELL_TOTAL = CELL + GAP;
const HEAT_COLORS = [
  'var(--color-heat-0)', 'var(--color-heat-1)', 'var(--color-heat-2)',
  'var(--color-heat-3)', 'var(--color-heat-4)',
];

function heatLevel(n: number) {
  if (n === 0) return 0; if (n <= 3) return 1;
  if (n <= 6) return 2; if (n <= 9) return 3; return 4;
}

function ContributionHeatmap({ data }: { data: ContribCalendar }) {
  const [tooltip, setTooltip] = useState<{ day: ContribDay; x: number; y: number } | null>(null);
  const { totalContributions, weeks } = data;

  const monthLabels = useMemo(() => {
    const out: { label: string; x: number }[] = [];
    let last = -1;
    weeks.forEach((w, wi) => {
      const d = w.contributionDays[0];
      if (d) {
        const m = new Date(d.date + 'T12:00:00').getMonth();
        if (m !== last) {
          out.push({ label: new Date(d.date + 'T12:00:00').toLocaleString('en-US', { month: 'short' }), x: wi * CELL_TOTAL });
          last = m;
        }
      }
    });
    return out;
  }, [weeks]);

  return (
    <section className="mb-20">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl font-serif text-ink">Contributions</h2>
        <span className="text-sm text-ink/50 font-light">
          {totalContributions.toLocaleString()} in the last year
        </span>
      </div>

      <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 overflow-x-auto">
        <div style={{ minWidth: `${28 + weeks.length * CELL_TOTAL}px` }}>
          {/* Month labels */}
          <div className="relative mb-1" style={{ height: 16, marginLeft: 28 }}>
            {monthLabels.map((m, i) => (
              <span key={i} className="absolute text-ink/40 select-none" style={{ left: m.x, fontSize: 10 }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1 select-none" style={{ gap: GAP }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} className="text-ink/40 flex items-center justify-end pr-1"
                  style={{ width: 24, height: CELL, fontSize: 9 }}>{d}</div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week.contributionDays[di];
                    if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                    return (
                      <div key={day.date} className="rounded-sm cursor-default"
                        style={{ width: CELL, height: CELL, backgroundColor: HEAT_COLORS[heatLevel(day.contributionCount)] }}
                        onMouseEnter={e => setTooltip({ day, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end text-xs text-ink/40 select-none">
            <span>Less</span>
            {HEAT_COLORS.map((c, i) => (
              <div key={i} className="rounded-sm" style={{ width: CELL, height: CELL, backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div className="fixed z-50 pointer-events-none bg-ink text-canvas text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          style={{ top: tooltip.y - 44, left: tooltip.x, transform: 'translateX(-50%)' }}>
          <strong>{tooltip.day.contributionCount}</strong> contribution{tooltip.day.contributionCount !== 1 ? 's' : ''} on{' '}
          {new Date(tooltip.day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
        </div>
      )}
    </section>
  );
}

// ─── Repo Card ────────────────────────────────────────────────────────────────
function RepoCard({ repo }: { repo: Repo }) {
  const dot = LANG_DOT[repo.language] ?? '#8b8680';
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-surface border border-subtle rounded-2xl p-6 flex flex-col gap-3 hover:border-accent/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-accent flex-shrink-0" />
          <span className="font-medium text-ink text-sm truncate group-hover:text-accent transition-colors">
            {repo.name}
          </span>
        </div>
        <ExternalLink size={13} className="text-ink/30 group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {repo.description && (
        <p className="text-xs text-ink/60 leading-relaxed line-clamp-2 font-light">{repo.description}</p>
      )}

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {repo.topics.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-subtle text-ink/60 border border-subtle">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-subtle/60 text-xs text-ink/50">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto"><Star size={11} /> {repo.stargazers_count}</span>
        <span className="flex items-center gap-1"><GitFork size={11} /> {repo.forks_count}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(repo.updated_at)}</span>
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type SortKey = 'updated' | 'stars' | 'forks' | 'name';

export default function GitHubPage() {
  const [data, setData] = useState<GithubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contribs, setContribs] = useState<ContribCalendar | null>(null);

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('stars');
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await apiJson<GithubData>('/api/v1/github');
      setData(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchContribs = useCallback(async () => {
    try {
      const result = await apiJson<ContribCalendar>('/api/v1/github/contributions');
      setContribs(result);
    } catch {
      // silently hide heatmap if token not configured
    }
  }, []);

  useEffect(() => { fetchData(); fetchContribs(); }, [fetchData, fetchContribs]);

  const filteredRepos = useMemo(() => {
    if (!data) return [];
    let list = [...data.repos];
    if (langFilter) list = list.filter(r => r.language === langFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.topics.some(t => t.includes(q)),
      );
    }
    switch (sortKey) {
      case 'stars':   list.sort((a, b) => b.stargazers_count - a.stargazers_count); break;
      case 'forks':   list.sort((a, b) => b.forks_count - a.forks_count); break;
      case 'name':    list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'updated': list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); break;
    }
    return list;
  }, [data, langFilter, search, sortKey]);

  const visibleRepos = showAll ? filteredRepos : filteredRepos.slice(0, 9);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-20">
        {/* Profile skeleton */}
        <div className="flex items-center gap-6 mb-16">
          <div className="w-20 h-20 rounded-full bg-subtle animate-pulse flex-shrink-0" />
          <div className="space-y-3">
            <div className="h-7 w-48 bg-subtle rounded animate-pulse" />
            <div className="h-4 w-72 bg-subtle rounded animate-pulse" />
            <div className="h-3 w-40 bg-subtle rounded animate-pulse" />
          </div>
        </div>
        <div className="h-36 bg-subtle rounded-2xl animate-pulse mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-subtle rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-20">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="font-medium text-red-700">Could not load GitHub data</p>
            <p className="text-sm text-red-600/80 mt-1">{error}</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, highlights, languages } = data;
  const totalStars = data.repos.reduce((s, r) => s + r.stargazers_count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div className="mb-16">
        <p className="text-sm uppercase tracking-widest text-accent font-medium mb-3">Open Source</p>
        <h1 className="text-4xl md:text-5xl font-serif text-ink leading-tight mb-4">
          Work on GitHub
        </h1>
        <p className="text-ink/60 font-light leading-relaxed max-w-xl">
          A collection of personal projects, experiments, and contributions I've built and shared publicly.
        </p>
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-surface border border-subtle rounded-2xl p-6 md:p-8 mb-12">
        <img
          src={profile.avatar_url}
          alt={profile.login}
          className="w-20 h-20 rounded-full border border-subtle flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-serif text-ink">{profile.name || profile.login}</h2>
            <a href={profile.html_url} target="_blank" rel="noopener noreferrer"
              className="text-ink/40 hover:text-accent transition-colors">
              <Github size={16} />
            </a>
          </div>
          {profile.bio && <p className="text-sm text-ink/60 font-light mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-ink/60">
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.blog && (
              <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                target="_blank" rel="noopener noreferrer"
                className="hover:text-accent transition-colors truncate max-w-xs">
                🔗 {profile.blog.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-center flex-shrink-0">
          {[
            { label: 'Repos', value: data.total_repos },
            { label: 'Stars', value: totalStars },
            { label: 'Followers', value: profile.followers },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-serif text-ink">{s.value}</p>
              <p className="text-xs text-ink/40 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contribution heatmap (only if token configured) ─────────────────── */}
      {contribs && <ContributionHeatmap data={contribs} />}

      {/* ── Featured repositories ───────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-serif text-ink">Featured</h2>
          <span className="text-sm text-ink/40 font-light">Top by stars</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map(repo => (
            <React.Fragment key={repo.id}>
              <RepoCard repo={repo} />
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── All repositories ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-serif text-ink">All Repositories</h2>
          <span className="text-sm text-ink/40 font-light">{data.total_repos} public repos</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, description, topic…"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-subtle rounded-xl text-sm text-ink focus:outline-none focus:border-accent transition-colors font-light"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              <select
                value={langFilter}
                onChange={e => setLangFilter(e.target.value)}
                className="pl-8 pr-8 py-2.5 bg-surface border border-subtle rounded-xl text-sm text-ink focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer font-light"
              >
                <option value="">All Languages</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2.5 bg-surface border border-subtle rounded-xl text-sm text-ink focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer font-light"
            >
              <option value="stars">Most Stars</option>
              <option value="updated">Recently Updated</option>
              <option value="forks">Most Forks</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {(langFilter || search) && (
          <div className="flex items-center gap-3 mb-4 text-sm text-ink/50">
            <span>{filteredRepos.length} results</span>
            <button onClick={() => { setLangFilter(''); setSearch(''); }}
              className="text-accent hover:underline text-xs">Clear filters</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRepos.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-ink/40 font-light">
              No repositories match your filters
            </div>
          ) : (
            visibleRepos.map(repo => (
              <React.Fragment key={repo.id}>
                <RepoCard repo={repo} />
              </React.Fragment>
            ))
          )}
        </div>

        {filteredRepos.length > 9 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAll(v => !v)}
              className="px-8 py-3 border border-subtle rounded-full text-sm font-medium text-ink/70 hover:text-ink hover:border-accent/50 transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${filteredRepos.length} repositories`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
