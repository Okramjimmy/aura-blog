import React from 'react';
import { Mail, MapPin, ExternalLink } from 'lucide-react';

const experience = [
  {
    role: 'System Engineer, R&D Section',
    org: 'IIT Guwahati',
    period: 'May 2025 – Present',
    current: true,
    bullets: [
      'Developing an internal ERP system using the open-source Frappe Framework to streamline research project management, HR, and asset tracking.',
      'Customizing Frappe modules for workflow automation, role-based permissions, and reporting.',
      'Managing backend infrastructure, deployment pipelines, and database configurations.',
      'Implementing automation scripts for deployment, monitoring, and maintenance using Docker, Git, and shell scripting.',
    ],
    tags: ['Frappe', 'Python', 'Docker', 'PostgreSQL', 'Shell'],
  },
  {
    role: 'Assistant Project Engineer, CLST',
    org: 'IIT Guwahati',
    period: 'July 2024 – May 2025',
    current: false,
    bullets: [
      'Led development of an AI-assisted legal translation system using NLP and Facebook\'s NLLB model, fine-tuned for machine translation of court judgments.',
      'Built and fine-tuned ML models for translation, text classification, LLMs, and named entity recognition.',
      'Deployed models on-premise with ReactJS, Next.js, MongoDB, PostgreSQL, Redis, Docker, and FastAPI.',
      'Implemented a web-based Word document editor with rich editing and formatting capabilities.',
    ],
    tags: ['NLP', 'FastAPI', 'React', 'Next.js', 'MongoDB', 'Redis', 'Docker'],
  },
  {
    role: 'Project Associate – I, OSINT Lab',
    org: 'IIT Guwahati',
    period: 'January 2022 – June 2024',
    current: false,
    bullets: [
      'Contributed to Vishleshakee 2, a social media analytics platform with sentiment analysis and web scraping capabilities.',
      'Used PySpark, Apache Kafka, Hadoop, and Spark Streaming for large-scale data processing integrated with Cassandra and Elasticsearch.',
      'Developed scalable web applications using the Laravel framework.',
      'Collaborated on government-funded projects (Ministry of Electronics and Information Technology, Government of India) focused on data analytics and web development.',
    ],
    tags: ['PySpark', 'Kafka', 'Hadoop', 'Elasticsearch', 'Cassandra', 'Laravel'],
  },
];

const skillGroups = [
  {
    label: 'ML & AI',
    skills: ['Model Deployment', 'NLP', 'Sentiment Analysis', 'NER', 'RAG', 'LLMs'],
  },
  {
    label: 'Data Engineering',
    skills: ['Apache Kafka', 'Hadoop', 'HDFS', 'Apache Airflow', 'PySpark', 'Spark Streaming'],
  },
  {
    label: 'Databases & Infra',
    skills: ['PostgreSQL', 'MongoDB', 'Elasticsearch', 'Cassandra', 'Redis', 'Docker'],
  },
  {
    label: 'Web Development',
    skills: ['React', 'Next.js', 'FastAPI', 'NestJS', 'Laravel', 'Node.js'],
  },
  {
    label: 'Programming',
    skills: ['Python', 'JavaScript / TypeScript', 'SQL', 'NoSQL'],
  },
];

export default function About() {
  return (
    <div className="px-4 md:px-8 lg:px-12 py-12 md:py-20 max-w-7xl mx-auto">

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
        <div className="order-2 lg:order-1">
          <h1 className="text-5xl md:text-6xl font-serif text-ink mb-4 leading-tight">
            Okram Jimmy Singh
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-ink/60">
            <span className="flex items-center gap-1.5"><MapPin size={14} /> Singjamei, Imphal West, Manipur</span>
            <a href="mailto:okramjimmy@gmail.com" className="flex items-center gap-1.5 hover:text-accent transition-colors">
              <Mail size={14} /> okramjimmy@gmail.com
            </a>
          </div>
          <div className="space-y-5 text-lg text-ink/80 font-light leading-relaxed">
            <p>
              Computer engineering graduate with nearly three and a half years of experience at IIT Guwahati in machine learning, data engineering, and full-stack web development.
            </p>
            <p>
              Skilled in deploying AI/ML models and implementing Retrieval-Augmented Generation (RAG) systems. Proficient in NestJS, ReactJS, PySpark, and Elasticsearch.
            </p>
            <p>
              This site is a personal space where I document what I build, write about engineering and design, and share thoughts on working with intention.
            </p>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl">
            <img
              src="https://picsum.photos/seed/portrait-okram/800/1000"
              alt="Okram Jimmy Singh"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="mb-24">
        <h2 className="text-3xl font-serif text-ink mb-10">Work Experience</h2>
        <div className="space-y-5">
          {experience.map((job, i) => (
            <div key={i} className="relative group">
              <div className="border border-subtle rounded-2xl bg-surface/50 overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all duration-300">
                {/* Accent left bar */}
                <div className="flex">
                  <div className={`w-1 flex-shrink-0 ${job.current ? 'bg-accent' : 'bg-subtle group-hover:bg-accent/40 transition-colors'}`} />
                  <div className="flex-1 p-8">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                      <div>
                        {job.current && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            Current Role
                          </span>
                        )}
                        <h3 className="text-xl font-medium text-ink leading-tight">{job.role}</h3>
                        <p className="text-accent/80 text-sm font-medium mt-1 uppercase tracking-wide">{job.org}</p>
                      </div>
                      <span className="flex-shrink-0 text-sm text-ink/50 font-light whitespace-nowrap bg-subtle/60 px-4 py-1.5 rounded-full self-start">
                        {job.period}
                      </span>
                    </div>

                    {/* Bullet points */}
                    <ul className="space-y-2.5 mb-6">
                      {job.bullets.map((b, j) => (
                        <li key={j} className="flex gap-3 text-ink/70 font-light leading-relaxed text-sm">
                          <span className="text-accent/50 mt-1.5 flex-shrink-0 text-[10px]">◆</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-lg border border-subtle bg-canvas/60 text-ink/50 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-24">
        <h2 className="text-3xl font-serif text-ink mb-10">Skills</h2>
        <div className="space-y-6">
          {skillGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-xl text-sm text-ink font-medium hover:border-accent/50 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research */}
      <section>
        <h2 className="text-3xl font-serif text-ink mb-8">Research</h2>
        <div className="border border-subtle rounded-2xl p-8 bg-surface/50 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Publication</p>
            <h3 className="text-xl font-medium text-ink mb-2">Research Paper on AI and Machine Learning</h3>
            <p className="text-ink/60 font-light text-sm">IEEE Xplore</p>
          </div>
          <a
            href="https://ieeexplore.ieee.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 text-sm text-ink/60 hover:text-accent transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

    </div>
  );
}
