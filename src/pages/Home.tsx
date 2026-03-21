import React, { useEffect, useState } from 'react';
import { ArrowRight, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo, { SITE_URL, AUTHOR } from '../components/Seo';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  created_at: string;
  is_published: boolean;
}

const IMAGE_SEEDS: Record<string, string> = {
  Engineering: 'code-desk',
  Design: 'design-studio',
  Journal: 'journal-light',
  Lifestyle: 'morning-ritual',
  default: 'minimal-room',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/v1/posts')
      .then(r => r.json())
      .then((data: Post[]) => setPosts(data.filter(p => p.is_published)));
  }, []);

  const featured = posts[0];
  const latest = posts.slice(1, 4);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aura',
    url: SITE_URL,
    author: {
      '@type': 'Person',
      name: AUTHOR,
      url: `${SITE_URL}/about`,
    },
    description: 'Personal blog and portfolio of Okram Jimmy Singh — essays on software engineering, machine learning, design, and building with intention.',
  };

  return (
    <>
      <Seo
        description="Personal blog and portfolio of Okram Jimmy Singh — essays on software engineering, machine learning, design, and building with intention."
        canonical="/"
        jsonLd={websiteJsonLd}
      />
      {/* Hero Section */}
      <section className="px-4 md:px-8 lg:px-12 py-12 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {featured ? (
            <>
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">Featured</span>
                  <span className="w-12 h-[1px] bg-subtle"></span>
                  <span className="text-xs font-medium uppercase tracking-widest text-ink/60">{formatDate(featured.created_at)}</span>
                </div>
                <h1 className="text-5xl md:text-7xl leading-[1.1] mb-6 text-ink">
                  {featured.title}
                </h1>
                <p className="text-lg md:text-xl text-ink/70 mb-10 max-w-2xl leading-relaxed font-light">
                  {featured.excerpt}
                </p>
                <Link to={`/blog/${featured.slug}`} className="inline-flex items-center gap-2 text-accent font-medium hover:gap-4 transition-all duration-300">
                  Read Full Article <ArrowRight size={18} />
                </Link>
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="aspect-[4/5] md:aspect-square lg:aspect-[3/4] overflow-hidden rounded-2xl">
                  <img
                    src={`https://picsum.photos/seed/${IMAGE_SEEDS[featured.category] ?? IMAGE_SEEDS.default}/1200/1600`}
                    alt={featured.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 animate-pulse space-y-6">
              <div className="h-4 bg-subtle rounded w-1/4" />
              <div className="h-16 bg-subtle rounded w-3/4" />
              <div className="h-6 bg-subtle rounded w-1/2" />
            </div>
          )}
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="px-4 md:px-8 lg:px-12 py-12 md:py-20 border-t border-subtle">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Articles List */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl text-ink">Latest Stories</h2>
              <Link to="/blog" className="text-sm font-medium uppercase tracking-widest text-ink/60 hover:text-accent transition-colors">View All</Link>
            </div>

            <div className="space-y-16">
              {latest.length > 0 ? latest.map(post => {
                const seed = IMAGE_SEEDS[post.category] ?? IMAGE_SEEDS.default;
                return (
                  <article key={post.id} className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl">
                      <img
                        src={`https://picsum.photos/seed/${seed}-${post.id.slice(0, 6)}/800/600`}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-medium uppercase tracking-widest text-accent">{post.category}</span>
                        <span className="text-xs text-ink/50">&bull;</span>
                        <span className="text-xs font-medium uppercase tracking-widest text-ink/60">{formatDate(post.created_at)}</span>
                      </div>
                      <h3 className="text-3xl mb-4 group-hover:text-accent transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-ink/70 mb-6 leading-relaxed font-light line-clamp-3">
                        {post.excerpt}
                      </p>
                      <Link to={`/blog/${post.slug}`} className="text-sm font-medium text-ink hover:text-accent transition-colors uppercase tracking-widest">Read More</Link>
                    </div>
                  </article>
                );
              }) : (
                <div className="space-y-16">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-pulse">
                      <div className="aspect-[4/3] bg-subtle rounded-xl" />
                      <div className="space-y-4">
                        <div className="h-3 bg-subtle rounded w-1/3" />
                        <div className="h-8 bg-subtle rounded w-5/6" />
                        <div className="h-4 bg-subtle rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-16 text-center">
              <Link to="/blog" className="inline-flex items-center justify-center px-8 py-3 border border-subtle text-ink hover:border-accent hover:text-accent transition-colors rounded-full font-medium tracking-wide">
                View All Articles
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-16">
            {/* Bio Widget */}
            <div className="bg-surface/50 p-8 rounded-2xl border border-subtle">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden">
                <img
                  src="https://picsum.photos/seed/portrait/400/400"
                  alt="Author Portrait"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-2xl text-center mb-4 text-ink">Okram Meitei</h3>
              <p className="text-ink/70 text-center text-sm leading-relaxed font-light mb-6">
                Software engineer and occasional writer. I build things for the web and write about design, engineering, and intentional living.
              </p>
              <div className="flex justify-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-subtle flex items-center justify-center text-ink/60 hover:text-accent hover:border-accent transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-subtle flex items-center justify-center text-ink/60 hover:text-accent hover:border-accent transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-subtle flex items-center justify-center text-ink/60 hover:text-accent hover:border-accent transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            {/* Categories Widget */}
            <div>
              <h3 className="text-xl mb-6 text-ink border-b border-subtle pb-4">Explore Topics</h3>
              <ul className="space-y-4">
                {['Engineering', 'Design', 'Journal'].map(cat => (
                  <li key={cat}>
                    <Link to="/blog" className="flex justify-between items-center group">
                      <span className="text-ink/80 group-hover:text-accent transition-colors font-light">{cat}</span>
                      <span className="text-xs font-mono text-ink/40 group-hover:text-accent transition-colors">
                        {posts.filter(p => p.category === cat).length.toString().padStart(2, '0')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Featured Quote */}
            <div className="p-8 bg-ink text-canvas rounded-2xl">
              <p className="font-serif text-2xl italic leading-snug mb-4">
                "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
              </p>
              <p className="text-sm text-canvas/60 uppercase tracking-widest font-medium">— Antoine de Saint-Exupéry</p>
            </div>
          </aside>

        </div>
      </section>
    </>
  );
}
