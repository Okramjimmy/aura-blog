import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Star, GitFork, ExternalLink, RefreshCw, AlertCircle, Loader2,
  Search, Github, Clock, TrendingUp, BookOpen, Activity, Filter,
  KeyRound, Globe,
} from 'lucide-react';
import { apiJson } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  login: string; name: string; bio: string; avatar_url: string; html_url: string;
  public_repos: number; followers: number; following: number;
  location: string; blog: string; created_at: string;
}
interface Repo {
  id: number; name: string; full_name: string; description: string;
  html_url: string; language: string; stargazers_count: number;
  forks_count: number; open_issues_count: number; topics: string[];
  updated_at: string; created_at: string; visibility: string;
}
interface Event {
  id: string; type: string; repo: string; repo_url: string;
  summary: string; created_at: string;
}
interface GithubData {
  profile: Profile;
  repos: Repo[];
  highlights: Repo[];
  activity: Event[];
  languages: string[];
  total_repos: number;
  cached: boolean;
  rate_limit_remaining: number;
}
interface ContribDay { date: string; contributionCount: number; color: string; }
interface ContribWeek { contributionDays: ContribDay[]; }
interface ContribCalendar {
  totalContributions: number;
  weeks: ContribWeek[];
  cached?: boolean;
}

// ─── Language colour map ──────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-100 text-blue-700',
  JavaScript: 'bg-yellow-100 text-yellow-700',
  Python: 'bg-green-100 text-green-700',
  PHP: 'bg-violet-100 text-violet-700',
  HTML: 'bg-orange-100 text-orange-700',
  CSS: 'bg-pink-100 text-pink-700',
  Shell: 'bg-gray-100 text-gray-700',
  Dockerfile: 'bg-sky-100 text-sky-700',
  Go: 'bg-cyan-100 text-cyan-700',
  Rust: 'bg-red-100 text-red-700',
  default: 'bg-subtle text-ink/60',
};
function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const cls = LANG_COLORS[lang] ?? LANG_COLORS.default;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{lang}</span>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Contribution Heatmap ─────────────────────────────────────────────────────
const CELL = 11;
const GAP = 3;
const CELL_TOTAL = CELL + GAP; // 14px per column
// Accent-tinted palette matching #D97757
const HEAT_COLORS = ['#E5E2D9', '#f7d4c2', '#f0a87c', '#e58040', '#D97757'];

function getHeatLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

function ContributionHeatmap({ data }: { data: ContribCalendar }) {
  const [tooltip, setTooltip] = useState<{ day: ContribDay; x: number; y: number } | null>(null);
  const { totalContributions, weeks } = data;

  const monthLabels = useMemo(() => {
    const labels: { label: string; x: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const first = week.contributionDays[0];
      if (first) {
        const m = new Date(first.date + 'T12:00:00').getMonth();
        if (m !== lastMonth) {
          labels.push({
            label: new Date(first.date + 'T12:00:00').toLocaleString('en-US', { month: 'short' }),
            x: wi * CELL_TOTAL,
          });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [weeks]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="bg-white border border-subtle rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-widest">Contribution Activity</h3>
        <div className="flex items-center gap-3 text-xs text-ink/50">
          <span>{totalContributions.toLocaleString()} contributions in the last year</span>
          {data.cached && <span className="text-emerald-600">● cached</span>}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: `${28 + weeks.length * CELL_TOTAL}px` }}>
          {/* Month labels */}
          <div className="relative mb-1" style={{ height: 16, marginLeft: 28 }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-ink/40 select-none"
                style={{ left: m.x, fontSize: 10, lineHeight: '16px' }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Day-label col + week grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1" style={{ gap: GAP }}>
              {dayLabels.map((d, i) => (
                <div
                  key={i}
                  className="text-ink/40 flex items-center justify-end pr-1 select-none"
                  style={{ width: 24, height: CELL, fontSize: 9 }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week.contributionDays[di];
                    if (!day) {
                      return (
                        <div key={di} style={{ width: CELL, height: CELL }} />
                      );
                    }
                    return (
                      <div
                        key={day.date}
                        className="rounded-sm cursor-default"
                        style={{
                          width: CELL,
                          height: CELL,
                          backgroundColor: HEAT_COLORS[getHeatLevel(day.contributionCount)],
                        }}
                        onMouseEnter={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
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
              <div
                key={i}
                className="rounded-sm"
                style={{ width: CELL, height: CELL, backgroundColor: c }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-ink text-canvas text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          style={{ top: tooltip.y - 44, left: tooltip.x, transform: 'translateX(-50%)' }}
        >
          <strong>{tooltip.day.contributionCount}</strong> contribution{tooltip.day.contributionCount !== 1 ? 's' : ''} on{' '}
          {new Date(tooltip.day.date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}

// ─── Repo Card ────────────────────────────────────────────────────────────────
function RepoCard({ repo }: { repo: Repo }) {
  return (
    <div className="bg-white border border-subtle rounded-xl p-5 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={15} className="text-accent flex-shrink-0" />
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink hover:text-accent transition-colors text-sm truncate"
          >
            {repo.name}
          </a>
        </div>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink/30 hover:text-accent transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {repo.description && (
        <p className="text-xs text-ink/60 leading-relaxed line-clamp-2">{repo.description}</p>
      )}

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {repo.topics.slice(0, 4).map(t => (
            <span
              key={t}
              className="text-xs bg-accent/8 text-accent/80 px-2 py-0.5 rounded-full border border-accent/20"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-subtle/60 text-xs text-ink/50">
        <LangBadge lang={repo.language} />
        <span className="flex items-center gap-1 ml-auto">
          <Star size={11} /> {repo.stargazers_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={11} /> {repo.forks_count}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {timeAgo(repo.updated_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Event icon map ────────────────────────────────────────────────────────────
const EVENT_ICONS: Record<string, string> = {
  PushEvent: '⬆', CreateEvent: '✨', PullRequestEvent: '🔀',
  IssuesEvent: '🐛', WatchEvent: '⭐', ForkEvent: '🍴',
  ReleaseEvent: '🚀', DeleteEvent: '🗑',
};

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 text-red-700">
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
      <div className="flex-grow">
        <p className="font-medium text-sm">Failed to load</p>
        <p className="text-xs mt-0.5 text-red-600/80">{message}</p>
        {message.includes('rate limit') && (
          <p className="text-xs mt-1.5 text-red-500">
            Add <code className="bg-red-100 px-1 rounded">GITHUB_TOKEN=ghp_...</code> to .env.local to increase limit to 5,000 req/hr.
          </p>
        )}
      </div>
      <button
        onClick={onRetry}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'highlights' | 'showcase' | 'activity';
type SortKey = 'updated' | 'stars' | 'forks' | 'name';

export default function AdminGitHub() {
  const [data, setData] = useState<GithubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contribs, setContribs] = useState<ContribCalendar | null>(null);
  const [contribsLoading, setContribsLoading] = useState(true);
  const [contribsError, setContribsError] = useState<string | null>(null);
  const [noToken, setNoToken] = useState(false);

  const [tab, setTab] = useState<Tab>('highlights');
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated');

  // ── Fetch main data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (bust = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<GithubData>(bust ? '/api/v1/github?bust=1' : '/api/v1/github');
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch contributions ──────────────────────────────────────────────────────
  const fetchContribs = useCallback(async (bust = false) => {
    setContribsLoading(true);
    setContribsError(null);
    setNoToken(false);
    try {
      const result = await apiJson<ContribCalendar>(
        bust ? '/api/v1/github/contributions?bust=1' : '/api/v1/github/contributions',
      );
      setContribs(result);
    } catch (e: any) {
      if (e.message?.includes('GITHUB_TOKEN')) {
        setNoToken(true);
      } else {
        setContribsError(e.message);
      }
    } finally {
      setContribsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchContribs(); }, [fetchContribs]);

  const handleRefresh = useCallback(() => {
    fetchData(true);
    fetchContribs(true);
  }, [fetchData, fetchContribs]);

  // ── Filtered + sorted repos ──────────────────────────────────────────────────
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

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-subtle rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-subtle rounded w-40 animate-pulse" />
            <div className="h-3 bg-subtle rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="h-36 bg-subtle rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 max-w-6xl mx-auto">
        <ErrorBanner message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  if (!data) return null;
  const { profile, highlights, activity, languages } = data;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'highlights', label: 'Overview', icon: TrendingUp },
    { key: 'showcase', label: `Showcase (${data.total_repos})`, icon: Globe },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="w-16 h-16 rounded-full border-2 border-subtle"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif text-ink">{profile.name || profile.login}</h1>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/40 hover:text-accent transition-colors"
              >
                <Github size={18} />
              </a>
            </div>
            {profile.bio && <p className="text-sm text-ink/60 font-light mt-0.5">{profile.bio}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink/50">
              <span>{profile.followers} followers</span>
              <span>{profile.following} following</span>
              {profile.location && <span>📍 {profile.location}</span>}
              {data.cached && <span className="text-emerald-600">● cached</span>}
              {data.rate_limit_remaining >= 0 && (
                <span className={data.rate_limit_remaining < 10 ? 'text-red-500 font-medium' : ''}>
                  {data.rate_limit_remaining} API calls left
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-subtle rounded-lg text-sm text-ink/60 hover:text-ink hover:border-accent/50 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Repositories', value: data.total_repos },
          { label: 'Total Stars', value: data.repos.reduce((a, r) => a + r.stargazers_count, 0) },
          { label: 'Total Forks', value: data.repos.reduce((a, r) => a + r.forks_count, 0) },
          { label: 'Languages', value: languages.length },
        ].map(s => (
          <div key={s.label} className="bg-white border border-subtle rounded-xl px-5 py-4">
            <p className="text-2xl font-serif text-ink">{s.value}</p>
            <p className="text-xs text-ink/50 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Contribution Heatmap ───────────────────────────────────────────── */}
      <div className="mb-8">
        {contribsLoading ? (
          <div className="bg-white border border-subtle rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span className="text-xs text-ink/50">Loading contribution data…</span>
            </div>
            <div className="h-24 bg-subtle rounded animate-pulse" />
          </div>
        ) : noToken ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <KeyRound size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">GitHub Token Required for Contribution Heatmap</p>
              <p className="text-xs text-amber-700 mt-1">
                The GitHub GraphQL API (used for contribution data) requires authentication.
                Add <code className="bg-amber-100 px-1 rounded">GITHUB_TOKEN=ghp_...</code> to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file and restart the server.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Create a token at github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens (needs <strong>read:user</strong> scope).
              </p>
            </div>
          </div>
        ) : contribsError ? (
          <ErrorBanner message={contribsError} onRetry={() => fetchContribs()} />
        ) : contribs ? (
          <ContributionHeatmap data={contribs} />
        ) : null}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-subtle">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW (Highlights) ─────────────────────────────────────────── */}
      {tab === 'highlights' && (
        <div className="space-y-6">
          <p className="text-sm text-ink/50">Top repositories by stars and recent activity</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.map(repo => (
              <React.Fragment key={repo.id}>
                <RepoCard repo={repo} />
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white border border-subtle rounded-xl p-6">
            <h3 className="text-sm font-medium text-ink mb-4 uppercase tracking-widest">Languages Used</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => {
                const count = data.repos.filter(r => r.language === lang).length;
                return (
                  <button
                    key={lang}
                    onClick={() => { setLangFilter(langFilter === lang ? '' : lang); setTab('showcase'); }}
                    className="flex items-center gap-2 px-3 py-1.5 border border-subtle rounded-lg text-sm hover:border-accent/40 transition-colors"
                  >
                    <LangBadge lang={lang} />
                    <span className="text-ink/50 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLIC SHOWCASE ─────────────────────────────────────────────────── */}
      {tab === 'showcase' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, description, topics…"
                className="w-full pl-9 pr-4 py-2 bg-white border border-subtle rounded-lg text-sm text-ink focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                <select
                  value={langFilter}
                  onChange={e => setLangFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-white border border-subtle rounded-lg text-sm text-ink focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                >
                  <option value="">All Languages</option>
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="px-3 py-2 bg-white border border-subtle rounded-lg text-sm text-ink focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="stars">Most Stars</option>
                <option value="forks">Most Forks</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink/40">
              {filteredRepos.length} of {data.total_repos} repositories
              {langFilter && ` · filtered by ${langFilter}`}
            </p>
            {(langFilter || search) && (
              <button
                onClick={() => { setLangFilter(''); setSearch(''); }}
                className="text-xs text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-ink/40">
                No repositories match your filters
              </div>
            ) : (
              filteredRepos.map(repo => (
                <React.Fragment key={repo.id}>
                  <RepoCard repo={repo} />
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVITY ─────────────────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <div className="space-y-2">
          {activity.length === 0 ? (
            <div className="py-16 text-center text-ink/40">No recent public activity</div>
          ) : (
            <div className="bg-white border border-subtle rounded-xl overflow-hidden divide-y divide-subtle">
              {activity.map(e => (
                <div
                  key={e.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-canvas/30 transition-colors"
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{EVENT_ICONS[e.type] ?? '●'}</span>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-ink leading-snug">{e.summary}</p>
                    <a
                      href={e.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mt-0.5 block truncate"
                    >
                      {e.repo}
                    </a>
                  </div>
                  <span className="text-xs text-ink/40 flex-shrink-0 mt-0.5 whitespace-nowrap">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
