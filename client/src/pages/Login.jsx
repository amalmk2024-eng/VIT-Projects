import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/audit');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail('developer@vit.edu');
    setPassword('VitDevPass@2026');
  }

  return (
    <div className="max-w-md mx-auto py-12 animate-fade-in">
      <div className="glass-card p-8 border-white/[0.08] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-cyan-500 shadow-lg shadow-accent-500/30 mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
              <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white/90">Developer Log In</h2>
          <p className="mt-1 text-xs text-white/40">
            Access multi-category audits, rule customization, and historical logs.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-white/70" htmlFor="login-password">
                Password
              </label>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-semibold mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                <span>Authenticating…</span>
              </>
            ) : (
              <span>Sign In with JWT</span>
            )}
          </button>
        </form>

        {/* Demo Account Quick-Fill Button */}
        <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            ⚡ Quick-fill demo credentials
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-white/40">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-accent-300 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
