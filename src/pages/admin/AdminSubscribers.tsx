import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, AlertCircle, Loader2, RefreshCw, Users } from 'lucide-react';
import { apiJson, authHeaders } from '../../lib/api';

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Page {
  data: Subscriber[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminSubscribers() {
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        order: sortOrder,
        active: String(activeOnly),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const data = await apiJson<Page>(`/api/v1/newsletters?${params}`, { headers: authHeaders() });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, sortOrder, debouncedSearch, activeOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    try {
      await apiJson(`/api/v1/newsletters/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchData();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-1">Subscribers</h1>
          <p className="text-ink/50 text-sm font-light">Newsletter mailing list</p>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <div className="flex items-center gap-2 text-sm text-ink/60 bg-white border border-subtle rounded-lg px-4 py-2">
              <Users size={16} />
              {result.total} subscriber{result.total !== 1 ? 's' : ''}
            </div>
          )}
          <button onClick={fetchData} className="p-2 text-ink/60 hover:text-ink border border-subtle rounded-lg transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-subtle rounded-lg text-sm text-ink focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer whitespace-nowrap bg-white border border-subtle rounded-lg px-4 py-2 hover:border-accent/50 transition-colors">
          <input type="checkbox" checked={activeOnly} onChange={e => { setActiveOnly(e.target.checked); setPage(1); }} className="accent-[var(--color-accent)]" />
          Active only
        </label>
        <button
          onClick={() => { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); setPage(1); }}
          className="flex items-center gap-2 text-sm text-ink/70 bg-white border border-subtle rounded-lg px-4 py-2 hover:border-accent/50 transition-colors whitespace-nowrap"
        >
          Date {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-subtle overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-subtle bg-canvas/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Email</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Status</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Subscribed</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center"><Loader2 className="animate-spin text-accent mx-auto" size={24} /></td></tr>
            ) : !result || result.data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-ink/40 text-sm">No subscribers found</td></tr>
            ) : result.data.map(s => (
              <tr key={s.id} className="hover:bg-canvas/30 transition-colors">
                <td className="px-4 py-3 text-sm text-ink font-medium">{s.email}</td>
                <td className="px-4 py-3">
                  {s.is_active
                    ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                    : <span className="text-xs font-medium text-ink/40 bg-subtle/60 px-2 py-0.5 rounded-full">Inactive</span>}
                </td>
                <td className="px-4 py-3 text-xs text-ink/50">
                  {new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteSubscriber(s.id)} title="Remove subscriber" className="p-1.5 text-ink/40 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-ink/50">
            {((result.page - 1) * result.limit) + 1}–{Math.min(result.page * result.limit, result.total)} of {result.total}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-subtle rounded-lg text-ink/60 hover:text-ink disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-ink/60 px-2">{page} / {result.pages}</span>
            <button disabled={page >= result.pages} onClick={() => setPage(p => p + 1)} className="p-2 border border-subtle rounded-lg text-ink/60 hover:text-ink disabled:opacity-30 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
