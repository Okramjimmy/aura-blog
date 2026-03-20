import React, { useState } from 'react';
import { Instagram, Twitter, Linkedin, Mail, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [form, setForm] = useState<FormData>({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-4 md:px-8 lg:px-12 py-20 max-w-5xl mx-auto w-full">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-serif text-ink mb-6">Say Hello.</h1>
        <p className="text-lg text-ink/70 font-light max-w-xl mx-auto leading-relaxed">
          Whether you have a project in mind, a question about my work, or just want to connect, I'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <CheckCircle size={48} className="text-emerald-500" />
              <h2 className="text-2xl font-serif text-ink">Message sent!</h2>
              <p className="text-ink/60 font-light">Thanks for reaching out. I'll get back to you soon.</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm text-accent hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit} noValidate>
              {status === 'error' && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium uppercase tracking-widest text-ink/60">
                    Name <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={set('name')}
                    required
                    className="w-full bg-transparent border-b border-subtle py-3 text-ink focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-ink/60">
                    Email <span className="text-accent">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                    className="w-full bg-transparent border-b border-subtle py-3 text-ink focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-xs font-medium uppercase tracking-widest text-ink/60">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={form.subject}
                  onChange={set('subject')}
                  className="w-full bg-transparent border-b border-subtle py-3 text-ink focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30"
                  placeholder="What's this about?"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-medium uppercase tracking-widest text-ink/60">
                  Message <span className="text-accent">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={set('message')}
                  required
                  className="w-full bg-transparent border-b border-subtle py-3 text-ink focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30 resize-none"
                  placeholder="Tell me what's on your mind..."
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full md:w-auto px-10 py-4 bg-accent text-canvas rounded-full font-medium tracking-wide hover:bg-accent/90 transition-colors mt-4 disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'loading' && <Loader2 size={18} className="animate-spin" />}
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-12">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-ink/60 mb-4">Direct Contact</h3>
            <a href="mailto:okramjimmy@gmail.com" className="flex items-center gap-3 text-xl font-serif text-ink hover:text-accent transition-colors group">
              <Mail size={20} className="text-ink/40 group-hover:text-accent" />
              okramjimmy@gmail.com
            </a>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-ink/60 mb-4">Location</h3>
            <p className="flex items-start gap-3 text-lg font-light text-ink/80 leading-relaxed">
              <MapPin size={20} className="text-ink/40 mt-1 flex-shrink-0" />
              Singjamei, Imphal West, Manipur<br />
              Available for remote work.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-ink/60 mb-6">Social</h3>
            <div className="flex gap-6">
              <a href="#" className="w-12 h-12 rounded-full border border-subtle flex items-center justify-center text-ink hover:text-accent hover:border-accent transition-colors"><Instagram size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full border border-subtle flex items-center justify-center text-ink hover:text-accent hover:border-accent transition-colors"><Twitter size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full border border-subtle flex items-center justify-center text-ink hover:text-accent hover:border-accent transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
