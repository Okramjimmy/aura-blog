import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  status: string;
  image_seed: string;
}

const STATUS_COLORS: Record<string, string> = {
  Live: 'bg-green-500/80',
  'Open Source': 'bg-blue-500/80',
  Ongoing: 'bg-amber-500/80',
  Complete: 'bg-ink/70',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetch('/api/v1/projects')
      .then(r => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const filtered = activeFilter === 'All' ? projects : projects.filter(p => p.category === activeFilter);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      <Seo
        title="Projects"
        description="A portfolio of selected projects in machine learning, data engineering, and full-stack web development by Okram Jimmy Singh."
        canonical="/projects"
      />
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-serif text-ink mb-6">Projects</h1>
        <p className="text-lg text-ink/70 font-light max-w-2xl mx-auto">
          Things I have built, designed, or researched — mostly for myself, occasionally for others.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 pb-6 border-b border-subtle gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <Filter size={18} className="text-ink/50 mr-2 flex-shrink-0" />
          {categories.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-ink text-canvas'
                  : 'text-ink/60 hover:text-ink hover:bg-subtle/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <span className="text-sm text-ink/40 font-mono hidden md:block">{filtered.length} projects</span>
      </div>

      {/* Masonry Grid */}
      {loading ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="break-inside-avoid animate-pulse rounded-2xl border border-subtle/50 overflow-hidden">
              <div className="aspect-[4/3] bg-subtle" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-subtle rounded w-3/4" />
                <div className="h-4 bg-subtle rounded w-full" />
                <div className="h-4 bg-subtle rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {filtered.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} className="break-inside-avoid group block">
              <div className="relative rounded-2xl overflow-hidden border border-subtle/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-surface/50">
                <img
                  src={`https://picsum.photos/seed/${project.image_seed}/800/600`}
                  alt={project.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-accent/80 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest rounded-full">
                    {project.category}
                  </span>
                  <span className={`px-3 py-1 ${STATUS_COLORS[project.status] ?? 'bg-ink/60'} backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest rounded-full`}>
                    {project.status}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-serif text-ink mb-2 group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-ink/70 text-sm font-light leading-relaxed mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-subtle/60 text-ink/60 text-xs rounded font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
