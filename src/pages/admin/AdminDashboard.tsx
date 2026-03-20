import React, { useEffect, useState, useCallback } from 'react';
import { FileText, FolderOpen, CheckCircle, Clock, TrendingUp, Plus, RefreshCw, AlertCircle, Mail, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiJson } from '../../lib/api';

interface Stats {
  posts: { total: number; published: number; draft: number };
  projects: { total: number; published: number; draft: number };
  contacts: { total: number; unread: number };
  newsletters: { total: number; active: number };
  recent_posts: { id: string; title: string; slug: string; category: string; is_published: boolean; created_at: string }[];
  recent_projects: { id: string; title: string; category: string; status: string; created_at: string }[];
}

function StatCard(props: { label: string; value: number; sub: string; icon: React.ElementType; color: string; to?: string }) {
  const Icon = props.icon;
  const inner = (
    <div className={`bg-white p-6 rounded-xl border border-subtle shadow-sm ${props.to ? 'hover:border-accent/40 transition-colors' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${props.color}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={12} /> {props.sub}
        </span>
      </div>
      <h3 className="text-3xl font-serif text-ink mb-1">{props.value}</h3>
      <p className="text-sm text-ink/60 uppercase tracking-widest">{props.label}</p>
    </div>
  );
  return props.to ? <Link to={props.to}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await apiJson<Stats>('/api/v1/stats');
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    const id = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-subtle rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-subtle rounded-xl" />)}
        </div>
        <div className="h-64 bg-subtle rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4 text-red-700">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Failed to load dashboard</p>
            <p className="text-sm mt-1 text-red-600/80">{error}</p>
          </div>
          <button onClick={() => fetchStats()} className="ml-auto px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-lg transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Dashboard</h1>
          <p className="text-ink/60 font-light">Welcome back, Okram.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2 text-ink/60 hover:text-ink border border-subtle rounded-lg transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link to="/admin/editor" className="px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm">
            <Plus size={16} /> New Post
          </Link>
          <Link to="/admin/project-editor" className="px-5 py-2.5 bg-ink text-white rounded-lg font-medium hover:bg-ink/90 transition-colors flex items-center gap-2 text-sm">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* Stat Cards — 6 real stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard label="Total Posts"     value={s.posts.total}        sub={`${s.posts.published} live`}       icon={FileText}    color="bg-canvas text-ink" />
        <StatCard label="Draft Posts"     value={s.posts.draft}        sub="unpublished"                        icon={Clock}       color="bg-amber-50 text-amber-600" />
        <StatCard label="Total Projects"  value={s.projects.total}     sub={`${s.projects.published} live`}    icon={FolderOpen}  color="bg-canvas text-ink" />
        <StatCard label="Live Projects"   value={s.projects.published} sub={`${s.projects.draft} in progress`} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Messages"        value={s.contacts.total}     sub={`${s.contacts.unread} unread`}     icon={Mail}        color="bg-blue-50 text-blue-600"    to="/admin/contacts" />
        <StatCard label="Subscribers"     value={s.newsletters.active} sub={`${s.newsletters.total} total`}   icon={Users}       color="bg-violet-50 text-violet-600" to="/admin/subscribers" />
      </div>

      {/* Recent activity tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif text-ink">Recent Posts</h2>
            <Link to="/admin/editor" className="text-xs text-ink/50 hover:text-accent uppercase tracking-widest transition-colors">New +</Link>
          </div>
          <div className="bg-white rounded-xl border border-subtle overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-subtle bg-canvas/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Title</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {s.recent_posts.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40 text-sm">No posts yet</td></tr>
                ) : s.recent_posts.map(post => (
                  <tr key={post.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink max-w-[180px]">
                      <Link to={`/admin/editor?id=${post.id}`} className="hover:text-accent transition-colors block truncate">{post.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      {post.is_published
                        ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Published</span>
                        : <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Draft</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/50">{new Date(post.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif text-ink">Recent Projects</h2>
            <Link to="/admin/project-editor" className="text-xs text-ink/50 hover:text-accent uppercase tracking-widest transition-colors">New +</Link>
          </div>
          <div className="bg-white rounded-xl border border-subtle overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-subtle bg-canvas/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Title</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {s.recent_projects.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40 text-sm">No projects yet</td></tr>
                ) : s.recent_projects.map(proj => (
                  <tr key={proj.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink max-w-[180px]">
                      <Link to={`/admin/project-editor?id=${proj.id}`} className="hover:text-accent transition-colors block truncate">{proj.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      {['Live','Open Source','Complete'].includes(proj.status)
                        ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{proj.status}</span>
                        : <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{proj.status}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/50">{new Date(proj.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
