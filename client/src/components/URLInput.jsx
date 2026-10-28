import { useState, useEffect } from 'react';

export default function URLInput({ onSubmit, loading, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    onSubmit(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4" id="url-input-form">
      <div className="glass-card p-2.5 shadow-float transition-all duration-300 hover:shadow-elevated">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Input field */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any public URL to audit (e.g. https://example.com)"
              disabled={loading}
              className="w-full rounded-xl border border-stone-200/70 bg-white/70 py-3.5 pl-11 pr-4 text-sm font-medium text-charcoal-900 placeholder-stone-400 outline-none transition-all duration-200 focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-400/20 disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !url.trim()}
            id="audit-button"
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap sm:min-w-[210px] py-3.5"
          >
            {loading ? (
              <>
                <span className="spinner border-stone-400 border-t-white" />
                <span>Scanning DOM…</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Audit & Remediate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-text hint */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
        <span>Headless Puppeteer Stealth active</span>
        <span className="text-stone-300">•</span>
        <span>WCAG 2.2 Level AA Engine</span>
      </div>
    </form>
  );
}
