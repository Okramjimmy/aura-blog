import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        navigate('/admin/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-10">
          <div className="text-3xl font-serif font-semibold tracking-tight text-ink mb-2">Aura.</div>
          <h1 className="text-xl text-ink/70 font-light">Admin Portal</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#B24C3D]/10 border border-[#B24C3D]/20 rounded-lg text-[#B24C3D] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-ink font-sans">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="w-full bg-transparent border border-subtle rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              placeholder="admin@aurablog.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-ink font-sans">Password</label>
              <a href="#" className="text-sm text-accent hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                className="w-full bg-transparent border border-subtle rounded-lg pl-4 pr-12 py-3 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded border-subtle text-accent focus:ring-accent" />
            <label htmlFor="remember" className="text-sm text-ink/70">Remember me for 30 days</label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
