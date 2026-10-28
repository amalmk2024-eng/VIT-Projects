import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const GRADE_COLORS = {
  A: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  B: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  C: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  D: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  F: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function AuditHistory({ onSelectAudit }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiFetch('/api/history');
      if (!data.success) throw new Error(data.error || 'Failed to load history');
      setHistory(data.history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    try {
      const { data } = await apiFetch('/api/history', { method: 'DELETE' });
      if (!data.success) throw new Error(data.error);
      setHistory([]);
    } catch (err) {
      setError(err.message);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white/90">Audit History</h2>
          <p className="mt-1 text-sm text-white/40">
            {history.length === 0 ? 'No audits have been run yet.' : `${history.length} audit${history.length !== 1 ? 's' : ''} recorded`}
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/30"
          >
            Clear History
          </button>
        )}
      </div>

      {error && (
        <div className="glass-card border-red-500/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {history.length === 0 && !error && (
        <div className="glass-card p-12 text-center">
          <div className="mb-4 text-4xl">📋</div>
          <h3 className="text-lg font-semibold text-white/60">No audits yet</h3>
          <p className="mt-2 text-sm text-white/30">
            Run your first audit from the Dashboard to see results here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {history.map((entry) => {
          const grade = GRADE_COLORS[entry.grade] || GRADE_COLORS.F;
          const date = new Date(entry.timestamp);
          const timeAgo = formatTimeAgo(date);

          return (
            <div key={entry.id} className="glass-card-hover p-5">
              <div className="flex items-center gap-4">
                {/* Grade Badge */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${grade.bg} ${grade.border} border`}>
                  <span className={`text-lg font-extrabold ${grade.text}`}>{entry.grade}</span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white/80" title={entry.url}>
                      {entry.url}
                    </p>
                  </div>
                  {entry.pageTitle && (
                    <p className="mt-0.5 truncate text-xs text-white/40">{entry.pageTitle}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
                    <span>{entry.totalErrors} violation{entry.totalErrors !== 1 ? 's' : ''}</span>
                    <span className="text-white/15">•</span>
                    <span className="text-emerald-400/70">{entry.totalFixed} fixed</span>
                    <span className="text-white/15">•</span>
                    <span title={date.toLocaleString()}>{timeAgo}</span>
                  </div>
                </div>

                {onSelectAudit && (
                  <button
                    type="button"
                    onClick={() => onSelectAudit(entry.url)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-accent-400/20 bg-accent-500/10 px-3.5 py-2 text-xs font-semibold text-accent-300 transition-all hover:bg-accent-500/20 hover:border-accent-400/40 hover:text-white"
                  >
                    <span>Re-audit</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
