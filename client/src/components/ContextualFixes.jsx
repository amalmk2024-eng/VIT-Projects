import { useState } from 'react';

export function FormLabelFixes({ fixes, scanned = 0 }) {
  return (
    <FixList
      fixes={fixes}
      title="Every interactive input control requires an accessible programmatic label (WCAG 1.3.1)."
      empty={
        scanned > 0
          ? `All ${scanned} scanned form controls contain valid accessible names.`
          : 'No visible form controls were detected on this document.'
      }
      kind="form"
    />
  );
}

export function LinkTextFixes({ fixes }) {
  return (
    <FixList
      fixes={fixes}
      title="Hyperlinks must convey clear, descriptive destinations out of context (WCAG 2.4.4)."
      empty="No ambiguous or vague anchor link names detected."
      kind="link"
    />
  );
}

function FixList({ fixes, title, empty, kind }) {
  if (fixes.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in shadow-float">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 border border-sage-200 text-2xl text-sage-700">
          ✓
        </div>
        <h3 className="font-serif text-xl font-bold text-charcoal-900">
          {kind === 'form' ? 'All Form Controls Labeled' : 'Descriptive Link Anchors'}
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">{empty}</p>
      </div>
    );
  }

  return (
    <section
      className="space-y-4 animate-fade-in"
      aria-label={kind === 'form' ? 'Form label fixes' : 'Link text fixes'}
    >
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
        <span>{title}</span>
      </div>
      {fixes.map((fix, index) => (
        <FixCard
          key={`${fix.selector || fix.href}-${index}`}
          fix={fix}
          kind={kind}
          index={index}
        />
      ))}
    </section>
  );
}

function FixCard({ fix, kind, index }) {
  const [copied, setCopied] = useState(false);
  const fixed = fix.status === 'fixed' || fix.status === 'fallback';
  const suggestion = kind === 'form' ? fix.label : fix.linkText;

  async function copyPatch() {
    if (!fix.remediatedHTML) return;
    try {
      await navigator.clipboard.writeText(fix.remediatedHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <article
      className="glass-card-hover p-6 sm:p-7 shadow-float"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={fixed ? 'badge-pass' : 'badge-error'}>
            {fix.status === 'fallback'
              ? 'Context Fallback'
              : fix.status === 'fixed'
                ? 'Gemini Remediation'
                : 'Review Required'}
          </span>
          {kind === 'form' ? (
            <span className="font-mono text-xs font-semibold text-charcoal-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {fix.type || 'input'}
            </span>
          ) : (
            <span className="text-xs font-mono text-stone-500 truncate max-w-xs">{fix.href}</span>
          )}
        </div>
        {fixed && (
          <span className="text-xs font-semibold text-sage-800 bg-sage-50 border border-sage-200/80 px-2.5 py-1 rounded-full">
            Suggested: {suggestion}
          </span>
        )}
      </div>

      <p className="font-serif italic text-sm text-charcoal-800 mt-2">
        {kind === 'form'
          ? fix.placeholder || fix.name || fix.id || 'Unlabeled interactive control'
          : `Detected Anchor Text: “${fix.text}”`}
      </p>

      {fix.context && (
        <p className="mt-2 text-xs text-stone-500 line-clamp-2">
          <strong className="text-stone-600">DOM Context:</strong> {fix.context}
        </p>
      )}

      {fix.status === 'fallback' && (
        <p className="mt-2 text-xs text-amber-700">
          Generated from adjacent markup semantics. Please verify context suitability.
        </p>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <CodePanel label="Detected Failing Markup" code={fix.originalHTML} />
        <CodePanel
          label="Remediated Accessible Patch"
          code={fix.remediatedHTML || fix.error || 'No patch generated'}
          highlight
        />
      </div>

      {fixed && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={copyPatch} className="copy-button">
            {copied
              ? 'Copied to Clipboard!'
              : kind === 'form'
                ? 'Copy Accessible HTML Patch'
                : 'Copy Updated Anchor Link'}
          </button>
        </div>
      )}
    </article>
  );
}

function CodePanel({ label, code, highlight = false }) {
  return (
    <div className="min-w-0">
      <p
        className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
          highlight ? 'text-sage-700' : 'text-stone-400'
        }`}
      >
        {label}
      </p>
      <pre
        className={`code-block overflow-x-auto whitespace-pre-wrap break-all text-xs leading-relaxed ${
          highlight ? 'border-sage-500/30' : ''
        }`}
      >
        {code}
      </pre>
    </div>
  );
}