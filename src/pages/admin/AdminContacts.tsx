import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Mail, MailOpen, ChevronLeft, ChevronRight, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiJson, authHeaders } from '../../lib/api';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Page {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type SortField = 'created_at' | 'name' | 'email' | 'is_read';

function Badge({ read }: { read: boolean }) {
  return read
    ? <span className="text-xs font-medium text-ink/40 bg-subtle/60 px-2 py-0.5 rounded-full">Read</span>
    : <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">New</span>;
}

export default function AdminContacts() {
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '15',
        sort: sortField, order: sortOrder,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(unreadOnly ? { unread: 'true' } : {}),
      });
      const data = await apiJson<Page>(`/api/v1/contacts?${params}`, { headers: authHeaders() });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortOrder, debouncedSearch, unreadOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = async (id: string) => {
    try {
      await apiJson(`/api/v1/contacts/${id}/read`, { method: 'PATCH', headers: authHeaders() });
      setResult(r => r ? { ...r, data: r.data.map(c => c.id === id ? { ...c, is_read: true } : c) } : r);
    } catch (e: any) { setError(e.message); }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await apiJson(`/api/v1/contacts/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchData();
    } catch (e: any) { setError(e.message); }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? <span className="ml-1 text-accent">{sortOrder === 'asc' ? '↑' : '↓'}</span> : null;

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-1">Inbox</h1>
          <p className="text-ink/50 text-sm font-light">Contact form submissions</p>
        </div>
        <button onClick={fetchData} className="p-2 text-ink/60 hover:text-ink border border-subtle rounded-lg transition-colors">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
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
            placeholder="Search by name, email, subject…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-subtle rounded-lg text-sm text-ink focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer whitespace-nowrap bg-white border border-subtle rounded-lg px-4 py-2 hover:border-accent/50 transition-colors">
          <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }} className="accent-[var(--color-accent)]" />
          Unread only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-subtle overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-subtle bg-canvas/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 cursor-pointer hover:text-accent" onClick={() => toggleSort('name')}>
                Name <SortIcon field="name" />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 cursor-pointer hover:text-accent" onClick={() => toggleSort('email')}>
                Email <SortIcon field="email" />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Subject</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 cursor-pointer hover:text-accent" onClick={() => toggleSort('is_read')}>
                Status <SortIcon field="is_read" />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 cursor-pointer hover:text-accent" onClick={() => toggleSort('created_at')}>
                Date <SortIcon field="created_at" />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="animate-spin text-accent mx-auto" size={24} /></td></tr>
            ) : !result || result.data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-ink/40 text-sm">No messages found</td></tr>
            ) : result.data.map(c => (
              <React.Fragment key={c.id}>
                <tr
                  className={`hover:bg-canvas/30 transition-colors cursor-pointer ${!c.is_read ? 'font-medium' : ''}`}
                  onClick={() => { setExpanded(expanded === c.id ? null : c.id); if (!c.is_read) markRead(c.id); }}
                >
                  <td className="px-4 py-3 text-sm text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-ink/70">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-ink/60 max-w-[180px] truncate">{c.subject || '—'}</td>
                  <td className="px-4 py-3"><Badge read={c.is_read} /></td>
                  <td className="px-4 py-3 text-xs text-ink/50">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {!c.is_read && (
                        <button onClick={() => markRead(c.id)} title="Mark as read" className="p-1.5 text-ink/40 hover:text-accent transition-colors">
                          <MailOpen size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteContact(c.id)} title="Delete" className="p-1.5 text-ink/40 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr className="bg-canvas/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex items-start gap-3 mb-2">
                        <Mail size={16} className="text-accent mt-0.5 flex-shrink-0" />
                        <a href={`mailto:${c.email}`} className="text-sm text-accent hover:underline">{c.email}</a>
                      </div>
                      <p className="text-sm text-ink/80 font-light leading-relaxed whitespace-pre-line">{c.message}</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-subtle rounded-lg text-ink/60 hover:text-ink disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-ink/60 px-2">{page} / {result.pages}</span>
            <button
              disabled={page >= result.pages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-subtle rounded-lg text-ink/60 hover:text-ink disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
