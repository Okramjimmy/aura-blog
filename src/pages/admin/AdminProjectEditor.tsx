import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Trash2, AlertCircle, Image as ImageIcon, Bold, Italic, Heading1, Heading2, List, Quote, Link as LinkIcon } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CATEGORIES = ['Engineering', 'Design', 'UX/UI', 'Research'];
const STATUSES = ['Draft', 'Live', 'Open Source', 'Ongoing', 'Complete'];

interface FormState {
  title: string;
  category: string;
  description: string;
  tagsInput: string;
  tags: string[];
  status: string;
  image_seed: string;
  sort_order: number;
}

export default function AdminProjectEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [form, setForm] = useState<FormState>({
    title: '',
    category: 'Engineering',
    description: '',
    tagsInput: '',
    tags: [],
    status: 'Draft',
    image_seed: '',
    sort_order: 0,
  });

  const [isLoading, setIsLoading] = useState(!!projectId);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    fetch(`/api/v1/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title: data.title || '',
          category: data.category || 'Engineering',
          description: data.description || '',
          tagsInput: (data.tags || []).join(', '),
          tags: data.tags || [],
          status: data.status || 'Draft',
          image_seed: data.image_seed || '',
          sort_order: data.sort_order || 0,
        });
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const parseTags = (input: string) => input.split(',').map(t => t.trim()).filter(Boolean);

  const handleTagsChange = (value: string) => {
    setForm(f => ({ ...f, tagsInput: value, tags: parseTags(value) }));
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = field === 'sort_order' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = async (overrideStatus?: string) => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setIsSaving(true);
    setError(null);

    const token = localStorage.getItem('admin_token');
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      tags: parseTags(form.tagsInput),
      status: overrideStatus ?? form.status,
      image_seed: form.image_seed,
      sort_order: form.sort_order,
    };

    try {
      const res = await fetch(
        projectId ? `/api/v1/projects/${projectId}` : '/api/v1/projects',
        {
          method: projectId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!projectId) navigate(`/admin/project-editor?id=${data.id}`, { replace: true });
      if (overrideStatus) setForm(f => ({ ...f, status: overrideStatus }));
      setLastSaved(new Date());
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !confirm('Delete this project? This cannot be undone.')) return;
    setIsDeleting(true);
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      navigate('/admin/dashboard');
    } catch {
      setError('Delete failed');
      setIsDeleting(false);
    }
  };

  const insertText = (prefix: string, suffix = '') => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.description.slice(start, end);
    const newText =
      form.description.slice(0, start) +
      prefix + selected + suffix +
      form.description.slice(end);
    setForm(f => ({ ...f, description: newText }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-canvas"><Loader2 className="animate-spin text-accent" /></div>;
  }

  const isLive = ['Live', 'Open Source', 'Complete'].includes(form.status);

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-subtle sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-ink/50">
            {projectId ? 'Edit Project' : 'New Project'}
          </span>
          {lastSaved && (
            <span className="text-xs text-ink/40">Saved at {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {projectId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-400 hover:text-red-600 border border-subtle rounded-lg transition-colors disabled:opacity-40"
              title="Delete project"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => handleSave('Draft')}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('Live')}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isLive ? 'Update' : 'Publish'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}

      <div className="flex flex-grow overflow-hidden">
        {/* Main editing area */}
        <div className="flex-grow overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto bg-white min-h-full p-12 rounded-xl shadow-sm border border-subtle">
            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-subtle pb-4 mb-8 sticky top-0 bg-white z-10">
              <button type="button" onClick={() => insertText('# ')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Heading 1"><Heading1 size={18} /></button>
              <button type="button" onClick={() => insertText('## ')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Heading 2"><Heading2 size={18} /></button>
              <div className="w-[1px] h-6 bg-subtle mx-2" />
              <button type="button" onClick={() => insertText('**', '**')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Bold"><Bold size={18} /></button>
              <button type="button" onClick={() => insertText('_', '_')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Italic"><Italic size={18} /></button>
              <button type="button" onClick={() => insertText('[', '](url)')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Link"><LinkIcon size={18} /></button>
              <div className="w-[1px] h-6 bg-subtle mx-2" />
              <button type="button" onClick={() => insertText('- ')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="List"><List size={18} /></button>
              <button type="button" onClick={() => insertText('> ')} className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors" title="Blockquote"><Quote size={18} /></button>
            </div>

            <input
              type="text"
              placeholder="Project Title..."
              value={form.title}
              onChange={set('title')}
              className="w-full text-5xl font-serif text-ink placeholder:text-ink/20 focus:outline-none bg-transparent mb-8"
            />
            <textarea
              ref={descRef}
              placeholder="Describe what this project is, why you built it, and what it does..."
              value={form.description}
              onChange={set('description')}
              rows={20}
              className="w-full text-lg text-ink/80 font-light leading-loose placeholder:text-ink/30 focus:outline-none bg-transparent resize-none"
            />
          </div>
        </div>

        {/* Settings Sidebar */}
        <aside className="w-80 bg-white border-l border-subtle overflow-y-auto flex-shrink-0">
          <div className="p-6 border-b border-subtle">
            <h3 className="font-medium text-ink">Project Settings</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Category</label>
              <select
                value={form.category}
                onChange={set('category')}
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Tags</label>
              <input
                type="text"
                value={form.tagsInput}
                onChange={e => handleTagsChange(e.target.value)}
                placeholder="React, TypeScript, PostgreSQL"
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-subtle/60 text-ink/70 text-xs rounded font-mono">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Seed */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Image Seed</label>
              <input
                type="text"
                value={form.image_seed}
                onChange={set('image_seed')}
                placeholder="e.g. my-project-name"
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {form.image_seed ? (
                <div className="mt-2 aspect-[4/3] overflow-hidden rounded-lg border border-subtle">
                  <img
                    src={`https://picsum.photos/seed/${form.image_seed}/400/300`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="mt-2 aspect-[4/3] rounded-lg border-2 border-dashed border-subtle flex flex-col items-center justify-center text-ink/30 bg-canvas/50">
                  <ImageIcon size={24} className="mb-2" />
                  <span className="text-xs">Enter a seed to preview</span>
                </div>
              )}
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/70">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={set('sort_order')}
                min={0}
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              <p className="text-xs text-ink/40">Lower numbers appear first on the Projects page.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
