import { useState } from 'react';

export default function AltTextFixes({ fixes }) {
  if (fixes.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in shadow-float">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 border border-sage-200 text-2xl text-sage-700">
          ✓
        </div>
        <h3 className="font-serif text-xl font-bold text-charcoal-900">
          Complete Image Accessibility
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
          Every audited graphical element contains an appropriate, descriptive text alternative.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in" id="alttext-results">
      {fixes.map((fix, i) => (
        <AltTextFixCard key={i} fix={fix} index={i} />
      ))}
    </div>
  );
}

function AltTextFixCard({ fix, index }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [manualAltText, setManualAltText] = useState('');
  const [manualHtml, setManualHtml] = useState(null);

  const hasSuggestion = fix.status === 'fixed' || fix.status === 'fallback' || manualHtml;

  function handleManualSave() {
    const altText = manualAltText.trim();
    if (!altText || !fix.originalHTML) return;
    const escapedAltText = altText
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const remediatedHTML = fix.originalHTML.replace(
      /<img\b/i,
      `<img alt="${escapedAltText}"`
    );
    setManualHtml(remediatedHTML);
  }

  async function handleCopy() {
    const htmlToCopy = manualHtml || fix.remediatedHTML;
    if (!htmlToCopy) return;
    try {
      await navigator.clipboard.writeText(htmlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div
      className="glass-card-hover p-6 sm:p-7 shadow-float"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Preview Frame */}
        <div className="flex-shrink-0">
          <div className="relative w-full md:w-52 h-40 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-inner">
            {!imgError ? (
              <img
                src={fix.src}
                alt={fix.altText || ''}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-300">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {/* Missing alt pill overlay */}
            <div className="absolute top-2.5 left-2.5">
              <span className="badge-fail text-[10px] bg-white/90 shadow-sm backdrop-blur-sm">
                Missing Alt
              </span>
            </div>
          </div>
        </div>

        {/* Details & Remediation */}
        <div className="flex-1 min-w-0">
          {/* Status badge & source */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {fix.status === 'fixed' ? (
                <span className="badge-pass">Gemini Multimodal AI</span>
              ) : fix.status === 'fallback' ? (
                <span className="badge-error">Contextual Draft</span>
              ) : (
                <span className="badge-error">Manual Review Required</span>
              )}
              <span className="text-[11px] font-mono text-stone-400">
                WCAG 1.1.1 (Non-text Content)
              </span>
            </div>
          </div>

          {/* Source URL */}
          <p className="text-xs text-stone-500 truncate mb-4 font-mono" title={fix.src}>
            <span className="text-stone-400">src:</span> {fix.src}
          </p>

          {hasSuggestion ? (
            <>
              {/* AI Alt-text Callout Box */}
              <div className="rounded-2xl border border-sage-200/80 bg-sage-50/50 p-4 sm:p-5 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-sage-700">
                    <path
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sage-800">
                    {manualHtml
                      ? 'Manual Alt-Text'
                      : fix.status === 'fixed'
                      ? 'Vision Model Descriptive Alt-Text'
                      : 'Context-Derived Draft Alt-Text'}
                  </span>
                </div>
                <p className="font-serif italic text-base text-charcoal-900 leading-relaxed">
                  "{manualHtml ? manualAltText : fix.altText}"
                </p>
              </div>

              {fix.status === 'fallback' && (
                <p className="mb-4 text-xs text-amber-700">
                  Derived from neighboring DOM elements. Please review prior to production deployment.
                </p>
              )}

              {/* Remediated HTML */}
              <div className="relative">
                <pre className="code-block overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
                  {manualHtml || fix.remediatedHTML}
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
                      <span>Copy HTML</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm text-amber-800">
                {fix.error || 'A human-written alt description is required.'}
              </p>
              <label className="mt-4 block text-xs font-semibold text-stone-700" htmlFor={`manual-alt-${index}`}>
                Descriptive alt text
              </label>
              <textarea
                id={`manual-alt-${index}`}
                value={manualAltText}
                onChange={(event) => setManualAltText(event.target.value)}
                placeholder="Describe the image's purpose and important visual information."
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white/80 px-3 py-2.5 text-sm text-charcoal-900 placeholder-stone-400 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-400/20"
              />
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!manualAltText.trim()}
                className="btn-sage mt-3 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create HTML patch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
