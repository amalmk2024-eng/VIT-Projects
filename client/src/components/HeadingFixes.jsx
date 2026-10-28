import { useState } from 'react';

export default function HeadingFixes({ fixes, trees, scanned = 0 }) {
  if (fixes.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in shadow-float">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 border border-sage-200 text-2xl text-sage-700">
          ✓
        </div>
        <h3 className="font-serif text-xl font-bold text-charcoal-900">
          Strict Sequential Heading Hierarchy
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
          {scanned > 0
            ? `All ${scanned} heading elements strictly adhere to sequential structural depths without skipping levels.`
            : 'No heading elements were detected on this document.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Structural Hierarchy Trees */}
      <div className="grid gap-6 md:grid-cols-2">
        <HeadingTree title="Detected Document Hierarchy" items={trees?.original || []} />
        <HeadingTree title="Remediated Sequential Hierarchy" items={trees?.corrected || []} corrected />
      </div>

      {/* Individual Fix Cards */}
      <div className="space-y-4">
        {fixes.map((fix, index) => (
          <HeadingFixCard key={`${fix.index}-${index}`} fix={fix} />
        ))}
      </div>
    </div>
  );
}

function HeadingTree({ title, items, corrected = false }) {
  return (
    <section className="glass-card p-6 shadow-float">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/80">
        <h3 className="font-serif text-base font-bold text-charcoal-900">{title}</h3>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            corrected
              ? 'bg-sage-50 text-sage-700 border-sage-200'
              : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}
        >
          {corrected ? 'Remediated' : 'Scanned DOM'}
        </span>
      </div>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.level}-${index}`}
            className="flex items-center gap-3 text-xs"
            style={{ paddingLeft: `${Math.max(0, (item.level - 1) * 16)}px` }}
          >
            <span
              className={`inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                corrected
                  ? 'bg-sage-100 text-sage-800 border border-sage-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              h{item.level}
            </span>
            <span className="min-w-0 truncate text-charcoal-800 font-medium">
              {item.text || <em className="text-stone-400">(empty heading)</em>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HeadingFixCard({ fix }) {
  const [copied, setCopied] = useState(false);

  async function copyPatch() {
    try {
      await navigator.clipboard.writeText(fix.remediatedHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <article className="glass-card-hover p-6 shadow-float">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="badge-fail">h{fix.fromLevel} skipped</span>
          <span className="text-stone-400">→</span>
          <span className="badge-pass">Remediated to h{fix.toLevel}</span>
        </div>
        <button
          type="button"
          onClick={copyPatch}
          className="copy-button"
        >
          {copied ? 'Copied!' : 'Copy Heading Patch'}
        </button>
      </div>

      <p className="font-serif italic text-sm text-charcoal-800 mb-4">
        "{fix.text}"
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block mb-1">
            Original Skipped Element
          </span>
          <pre className="code-block overflow-x-auto whitespace-pre-wrap text-xs">{fix.originalHTML}</pre>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-sage-700 tracking-wider block mb-1">
            Remediated Sequential Element
          </span>
          <pre className="code-block overflow-x-auto whitespace-pre-wrap text-xs border-sage-500/30">{fix.remediatedHTML}</pre>
        </div>
      </div>
    </article>
  );
}