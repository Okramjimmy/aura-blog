import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ProjectDetail from './pages/ProjectDetail';
import GitHubPage from './pages/GitHub';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEditor from './pages/admin/AdminEditor';
import AdminProjectEditor from './pages/admin/AdminProjectEditor';
import AdminContacts from './pages/admin/AdminContacts';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import AdminMedia from './pages/admin/AdminMedia';
import AdminGitHub from './pages/admin/AdminGitHub';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="projects" element={<Projects />} />
          <Route path="contact" element={<Contact />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="github" element={<GitHubPage />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="editor" element={<AdminEditor />} />
          <Route path="project-editor" element={<AdminProjectEditor />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="github" element={<AdminGitHub />} />
        </Route>
      </Routes>
    </Router>
  );
}
