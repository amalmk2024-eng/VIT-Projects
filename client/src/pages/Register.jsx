import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showOptionalKey, setShowOptionalKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        geminiKey: geminiKey.trim(),
      });
      navigate('/audit');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 animate-fade-in">
      <div className="glass-card p-8 border-white/[0.08] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-cyan-500 shadow-lg shadow-accent-500/30 mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
              <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white/90">Create Developer Account</h2>
          <p className="mt-1 text-xs text-white/40">
            Unlock persistent MongoDB audit history, rule configuration, and full exports.
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
            <label className="block text-xs font-semibold text-white/70 mb-1.5" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@organization.com"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5" htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="≥ 6 chars"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5" htmlFor="reg-confirm">
                Confirm
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
              />
            </div>
          </div>

          {/* Optional Gemini API key accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalKey(!showOptionalKey)}
              className="text-xs text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1 mt-1"
            >
              <span>{showOptionalKey ? '▾ Hide' : '▸ Custom Gemini API Key (Optional)'}</span>
            </button>
            {showOptionalKey && (
              <div className="mt-2">
                <input
                  type="text"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use server key)"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none transition-all focus:border-accent-400/50 focus:bg-white/[0.06]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-semibold mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                <span>Creating Account…</span>
              </>
            ) : (
              <span>Register & Start Auditing</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/40">
          Already registered?{' '}
          <Link to="/login" className="text-accent-300 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
