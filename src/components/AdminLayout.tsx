import React from 'react';
import { LayoutDashboard, PenTool, FolderOpen, Image as ImageIcon, LogOut, Mail, Users, Github } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/editor', icon: PenTool, label: 'Write' },
    { path: '/admin/project-editor', icon: FolderOpen, label: 'Projects' },
    { path: '/admin/contacts', icon: Mail, label: 'Inbox' },
    { path: '/admin/subscribers', icon: Users, label: 'Subscribers' },
    { path: '/admin/github', icon: Github, label: 'GitHub' },
    { path: '/admin/media', icon: ImageIcon, label: 'Media' },
  ];

  return (
    <div className="admin-wrapper min-h-screen bg-canvas flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F2F0E9] border-r border-subtle flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="text-2xl font-serif font-semibold tracking-tight text-ink">Aura.</div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mt-1">Workspace</div>
        </div>

        <nav className="flex-grow py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/admin/dashboard' && location.pathname === '/admin');
              const Icon = item.icon;
              return (
                <li key={item.path} className="relative">
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" />}
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-8 py-3 transition-colors ${
                      isActive ? 'text-accent font-medium bg-white/50' : 'text-ink/70 hover:text-ink hover:bg-white/30'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-8 border-t border-subtle/50">
          <Link to="/" className="flex items-center gap-3 text-ink/70 hover:text-ink transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Back to Site</span>
          </Link>
        </div>
      </aside>

      <main className="flex-grow overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
