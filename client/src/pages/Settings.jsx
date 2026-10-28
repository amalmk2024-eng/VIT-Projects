import { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load settings');
      setSettings(data.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateApiKey(e) {
    e.preventDefault();
    if (!newKey.trim() || newKey.trim().length < 10) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: newKey.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaveMessage({ type: 'success', text: 'API key updated successfully.' });
      setNewKey('');
      fetchSettings();
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white/90">Settings & API Management</h2>
        <p className="mt-1 text-sm text-white/40">
          Manage your Gemini API configuration and view system status.
        </p>
      </div>

      {error && (
        <div className="glass-card border-red-500/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* API Key Section */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-accent-400">
            <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Gemini API Key
        </h3>

        {/* Current Status */}
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 mb-1">Current Key</p>
              <p className="font-mono text-sm text-white/70">
                {showKey ? settings?.geminiApiKey : '••••••••••••••••••••'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-white/50 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                settings?.geminiApiKeyConfigured
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${settings?.geminiApiKeyConfigured ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {settings?.geminiApiKeyConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={updateApiKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter new Gemini API key"
            className="flex-1 rounded-xl border border-transparent bg-white/[0.04] py-3 px-4 text-sm font-medium text-white placeholder-white/25 outline-none transition-all focus:border-accent-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-accent-400/20"
          />
          <button
            type="submit"
            disabled={saving || newKey.trim().length < 10}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap px-6"
          >
            {saving ? (
              <>
                <span className="spinner" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Update Key</span>
            )}
          </button>
        </form>

        {saveMessage && (
          <p className={`mt-3 text-sm ${saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {saveMessage.text}
          </p>
        )}
      </div>

      {/* Model & Cache Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          label="AI Model"
          value={settings?.geminiModel || 'N/A'}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-cyan-400">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          }
        />
        <InfoCard
          label="Rate Limit"
          value={`${settings?.rpmLimit || 15} RPM`}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-amber-400">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <InfoCard
          label="Cache Entries"
          value={`${settings?.cache?.entries || 0} / ${settings?.cache?.maxSize || 512}`}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-emerald-400">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          }
        />
        <InfoCard
          label="Image Limit"
          value={`${settings?.imageLimitPerAudit || 5} / audit`}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-purple-400">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="glass-card p-4 transition-all duration-300 hover:border-white/[0.12]">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className="text-lg font-bold text-white/80">{value}</p>
    </div>
  );
}
