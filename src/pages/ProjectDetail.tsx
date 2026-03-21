import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Seo, { SITE_URL, AUTHOR } from '../components/Seo';

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
  Draft: 'bg-subtle text-ink/60',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/projects/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(data => { if (data) setProject(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 py-20 max-w-4xl mx-auto animate-pulse space-y-8">
        <div className="h-4 bg-subtle rounded w-24" />
        <div className="aspect-[16/9] bg-subtle rounded-2xl" />
        <div className="h-12 bg-subtle rounded w-3/4" />
        <div className="h-4 bg-subtle rounded w-full" />
        <div className="h-4 bg-subtle rounded w-5/6" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="px-4 py-32 text-center">
        <h1 className="text-4xl font-serif text-ink mb-4">Project not found</h1>
        <Link to="/projects" className="text-accent hover:underline">Back to Projects</Link>
      </div>
    );
  }

  const projectJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.description,
    author: { '@type': 'Person', name: AUTHOR, url: `${SITE_URL}/about` },
    applicationCategory: project.category,
    keywords: Array.isArray(project.tags) ? project.tags.join(', ') : project.tags,
  };

  return (
    <article className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-4xl mx-auto">
      <Seo
        title={project.title}
        description={project.description}
        canonical={`/projects/${project.id}`}
        ogImage={`https://picsum.photos/seed/${project.image_seed || project.id}/1200/630`}
        jsonLd={projectJsonLd}
      />
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink/60 hover:text-accent transition-colors mb-12">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-12">
        <img
          src={`https://picsum.photos/seed/${project.image_seed || project.id}/1600/900`}
          alt={project.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="px-3 py-1 bg-accent/15 text-accent text-xs font-bold uppercase tracking-widest rounded-full">
          {project.category}
        </span>
        <span className={`px-3 py-1 ${STATUS_COLORS[project.status] ?? 'bg-subtle'} text-white text-xs font-bold uppercase tracking-widest rounded-full`}>
          {project.status}
        </span>
      </div>

      <h1 className="text-5xl md:text-6xl font-serif text-ink leading-tight mb-8">
        {project.title}
      </h1>

      <div className="prose prose-lg prose-stone max-w-none font-light leading-loose text-ink/80 mb-12 whitespace-pre-line">
        {project.description}
      </div>

      {project.tags.length > 0 && (
        <div className="border-t border-subtle pt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-4">Stack</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-xl text-sm text-ink font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
