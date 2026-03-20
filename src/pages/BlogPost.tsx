import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'blockquote' | 'image';
  text?: string;
  src?: string;
  caption?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: Block[];
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function estimateReadTime(blocks: Block[]) {
  const words = blocks.reduce((acc, b) => acc + (b.text?.split(' ').length ?? 0), 0);
  return Math.max(1, Math.round(words / 200));
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case 'h1':
      return null; // rendered in header
    case 'h2':
      return <h2 key={index} className="text-3xl font-serif text-ink mt-16 mb-8">{block.text}</h2>;
    case 'h3':
      return <h3 key={index} className="text-2xl font-serif text-ink mt-12 mb-6">{block.text}</h3>;
    case 'blockquote':
      return (
        <blockquote key={index} className="my-16 p-8 bg-accent/5 border-l-4 border-accent rounded-r-2xl">
          <p className="text-3xl md:text-4xl font-serif text-accent leading-tight italic m-0">{block.text}</p>
        </blockquote>
      );
    case 'image':
      return (
        <figure key={index} className="my-12">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl">
            <img src={block.src} alt={block.caption ?? ''} className="w-full h-full object-cover" />
          </div>
          {block.caption && <figcaption className="text-center text-sm text-ink/50 mt-4 font-light italic">{block.caption}</figcaption>}
        </figure>
      );
    case 'paragraph':
    default:
      return <p key={index}>{block.text}</p>;
  }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/v1/posts/slug/${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setPost(data); })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(windowHeight > 0 ? totalScroll / windowHeight : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 py-20 max-w-4xl mx-auto animate-pulse space-y-8">
        <div className="h-4 bg-subtle rounded w-1/4 mx-auto" />
        <div className="h-16 bg-subtle rounded w-3/4 mx-auto" />
        <div className="h-4 bg-subtle rounded w-1/2 mx-auto" />
        <div className="aspect-[16/9] bg-subtle rounded-2xl" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="px-4 py-32 text-center">
        <h1 className="text-4xl font-serif text-ink mb-4">Post not found</h1>
        <Link to="/blog" className="text-accent hover:underline">Back to Journal</Link>
      </div>
    );
  }

  const bodyBlocks = post.content.filter(b => b.type !== 'h1');
  const readTime = estimateReadTime(post.content);

  return (
    <div className="relative">
      <div
        className="fixed top-0 left-0 h-1 bg-accent z-[60] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      <article className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink/60 hover:text-accent transition-colors mb-12">
            <ArrowLeft size={16} /> Back to Journal
          </Link>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="px-3 py-1 bg-accent/15 text-accent text-xs font-bold uppercase tracking-widest rounded-full">{post.category}</span>
            <span className="w-12 h-[1px] bg-subtle"></span>
            <span className="text-xs font-medium uppercase tracking-widest text-ink/60">{formatDate(post.created_at)}</span>
            <span className="text-xs text-ink/50">&bull;</span>
            <span className="text-xs font-medium uppercase tracking-widest text-ink/60">{readTime} Min Read</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-ink leading-[1.1] mb-8">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl md:text-2xl text-ink/70 font-light leading-relaxed max-w-3xl mx-auto">
              {post.excerpt}
            </p>
          )}
        </header>

        <figure className="mb-20">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl">
            <img
              src={`https://picsum.photos/seed/${post.slug}/1600/900`}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </figure>

        <div className="prose prose-lg md:prose-xl prose-stone max-w-3xl mx-auto font-light leading-loose text-ink/80">
          {bodyBlocks.map((block, i) => renderBlock(block, i))}

          <div className="mt-16 border-t border-b border-subtle/50 py-8 flex justify-between items-center">
            <button className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink/60 hover:text-accent transition-colors">
              <Share2 size={18} /> Share
            </button>
            <button className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink/60 hover:text-accent transition-colors">
              <Bookmark size={18} /> Save
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
