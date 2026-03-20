import React, { useEffect, useState } from 'react';
import { Bold, Italic, Link as LinkIcon, Heading1, Heading2, Image as ImageIcon, List, Quote, Settings, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function AdminEditor() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('id');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (postId) {
      fetch(`/api/v1/posts/${postId}`)
        .then(res => res.json())
        .then(data => {
          setTitle(data.title);
          // Simple mapping of blocks to text for this prototype editor
          const textContent = data.content.map((b: any) => b.text).join('\n\n');
          setContent(textContent);
          setIsPublished(data.is_published);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [postId]);

  const handleSave = async (publish: boolean) => {
    if (!postId) return; // In a full app, we'd create a new post here
    setIsSaving(true);
    
    // Convert text back to simple blocks for the backend
    const blocks = content.split('\n\n').map(text => ({
      type: 'paragraph',
      text
    }));

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content: blocks,
          is_published: publish
        })
      });

      if (res.ok) {
        setLastSaved(new Date());
        setIsPublished(publish);
      }
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-canvas"><Loader2 className="animate-spin text-accent" /></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Sticky Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-subtle sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink/50">
            {lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isPublished ? 'Update Published' : 'Publish'}
          </button>
          <button className="p-2 text-ink/60 hover:text-ink transition-colors border border-subtle rounded-lg ml-2">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Editor Canvas */}
        <div className="flex-grow overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto bg-white min-h-full p-12 rounded-xl shadow-sm border border-subtle">
            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-subtle pb-4 mb-8 sticky top-0 bg-white z-10">
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><Heading1 size={18} /></button>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><Heading2 size={18} /></button>
              <div className="w-[1px] h-6 bg-subtle mx-2"></div>
              <button className="p-2 text-accent bg-accent/10 rounded transition-colors"><Bold size={18} /></button>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><Italic size={18} /></button>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><LinkIcon size={18} /></button>
              <div className="w-[1px] h-6 bg-subtle mx-2"></div>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><List size={18} /></button>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><Quote size={18} /></button>
              <button className="p-2 text-ink/60 hover:text-accent hover:bg-accent/5 rounded transition-colors"><ImageIcon size={18} /></button>
            </div>

            {/* Writing Area */}
            <div className="prose prose-lg prose-stone max-w-none focus:outline-none">
              <input 
                type="text" 
                placeholder="Post Title..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-5xl font-serif text-ink mb-8 placeholder:text-ink/20 focus:outline-none bg-transparent"
              />
              <textarea 
                className="w-full h-full min-h-[500px] text-lg text-ink/80 font-light leading-loose placeholder:text-ink/30 focus:outline-none bg-transparent resize-none"
                placeholder="Start writing your story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Settings) */}
        <aside className="w-80 bg-white border-l border-subtle overflow-y-auto flex-shrink-0">
          <div className="p-6 border-b border-subtle">
            <h3 className="font-medium text-ink">Post Settings</h3>
          </div>
          
          <div className="p-6 space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-ink/70">URL Slug</label>
              <input 
                type="text" 
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                defaultValue="intentional-living"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-ink/70">Category</label>
              <select className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none">
                <option>Design</option>
                <option>Lifestyle</option>
                <option>Journal</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-ink/70">Tags</label>
              <input 
                type="text" 
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="Add tags separated by commas"
                defaultValue="minimalism, focus, productivity"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 bg-subtle/50 text-ink/70 text-xs rounded">minimalism</span>
                <span className="px-2 py-1 bg-subtle/50 text-ink/70 text-xs rounded">focus</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-ink/70">Featured Image</label>
              <div className="border-2 border-dashed border-subtle rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-accent/50 transition-colors cursor-pointer bg-canvas/50">
                <ImageIcon size={24} className="text-ink/40 mb-2" />
                <span className="text-sm text-ink/60">Click to upload or drag and drop</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-ink/70">Excerpt</label>
              <textarea 
                className="w-full bg-transparent border border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                rows={4}
                placeholder="Write a brief summary..."
                defaultValue="Discover how stripping away the non-essential allows us to focus on what truly matters."
              ></textarea>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
