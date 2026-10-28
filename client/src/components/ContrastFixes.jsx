import { useState } from 'react';

export default function ContrastFixes({ fixes }) {
  if (fixes.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in shadow-float">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 border border-sage-200 text-2xl text-sage-700">
          ✓
        </div>
        <h3 className="font-serif text-xl font-bold text-charcoal-900">
          Pristine Color Contrast
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
          Every audited textual element strictly satisfies or exceeds WCAG 2.2 AA contrast ratios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in" id="contrast-results">
      {fixes.map((fix, i) => (
        <ContrastFixCard key={i} fix={fix} index={i} />
      ))}
    </div>
  );
}

function ContrastFixCard({ fix, index }) {
  const [copied, setCopied] = useState(false);

  const cssSnippet = `/* WCAG 2.2 AA Contrast Remediation — ${fix.selector} */
/* Initial:  ${fix.original.fgHex} on ${fix.original.bgHex} → ${fix.original.ratio}:1 (FAIL) */
/* Remediated: ${fix.remediated.fgHex} on ${fix.remediated.bgHex} → ${fix.remediated.ratio}:1 (PASS) */

${fix.selector} {
  color: ${fix.remediated.fgHex};
}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div
      className="glass-card-hover p-6 sm:p-7 shadow-float"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <code className="rounded-lg bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 text-xs font-mono font-semibold text-charcoal-800">
              &lt;{fix.tagName}&gt;
            </code>
            <span className={fix.isLargeText ? 'badge-pass' : 'badge-fail'}>
              {fix.isLargeText ? 'Large Text (3.0:1)' : 'Normal Text (4.5:1)'}
            </span>
            <span className="text-xs text-stone-500">
              Required Threshold: <strong className="text-charcoal-800">{fix.threshold}:1</strong>
            </span>
          </div>
          <p className="text-sm font-serif italic text-charcoal-700 truncate" title={fix.text}>
            "{fix.text}"
          </p>
        </div>
      </div>

      {/* Before vs After comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* BEFORE */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-fail">Initial — Failing</span>
            <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-full">
              {fix.original.ratio}:1
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="color-swatch rounded-lg"
                style={{ backgroundColor: fix.original.fgHex }}
                title={fix.original.fgHex}
              />
              <div>
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Foreground</p>
                <p className="font-mono text-xs font-semibold text-charcoal-800">{fix.original.fgHex}</p>
              </div>
            </div>
            <span className="text-stone-300">/</span>
            <div className="flex items-center gap-2.5">
              <span
                className="color-swatch rounded-lg"
                style={{ backgroundColor: fix.original.bgHex }}
                title={fix.original.bgHex}
              />
              <div>
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Background</p>
                <p className="font-mono text-xs font-semibold text-charcoal-800">{fix.original.bgHex}</p>
              </div>
            </div>
          </div>
          {/* Visual preview */}
          <div
            className="mt-4 rounded-xl p-3.5 text-xs font-medium border border-black/5 shadow-inner"
            style={{ backgroundColor: fix.original.bgHex, color: fix.original.fgHex }}
          >
            Sample rendered text preview
          </div>
        </div>

        {/* AFTER */}
        <div className="rounded-2xl border border-sage-200/80 bg-sage-50/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-pass">Remediated — Compliant</span>
            <span className="font-mono text-xs font-bold text-sage-800 bg-sage-100/80 px-2 py-0.5 rounded-full">
              {fix.remediated.ratio}:1
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="color-swatch rounded-lg"
                style={{ backgroundColor: fix.remediated.fgHex }}
                title={fix.remediated.fgHex}
              />
              <div>
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Remediated FG</p>
                <p className="font-mono text-xs font-bold text-sage-800">{fix.remediated.fgHex}</p>
              </div>
            </div>
            <span className="text-stone-300">/</span>
            <div className="flex items-center gap-2.5">
              <span
                className="color-swatch rounded-lg"
                style={{ backgroundColor: fix.remediated.bgHex }}
                title={fix.remediated.bgHex}
              />
              <div>
                <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Background</p>
                <p className="font-mono text-xs font-semibold text-charcoal-800">{fix.remediated.bgHex}</p>
              </div>
            </div>
          </div>
          {/* Visual preview */}
          <div
            className="mt-4 rounded-xl p-3.5 text-xs font-medium border border-black/5 shadow-inner"
            style={{ backgroundColor: fix.remediated.bgHex, color: fix.remediated.fgHex }}
          >
            Sample rendered text preview
          </div>
        </div>
      </div>

      {/* Code Snippet + Copy */}
      <div className="relative">
        <pre className="code-block overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
          {cssSnippet}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-medium text-stone-200 transition-all hover:bg-white/20 hover:text-white"
        >
          {copied ? (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-sage-400">
                <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy CSS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
