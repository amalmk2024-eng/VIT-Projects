import { useState } from 'react';

const RULES = [
  {
    id: 'contrast',
    label: 'Color Contrast',
    description: 'WCAG 2.2 AA contrast ratio analysis with automatic HSL-based color remediation.',
    icon: '🎨',
    wcag: '1.4.3 Contrast (Minimum)',
  },
  {
    id: 'altText',
    label: 'Image Alt-Text',
    description: 'Detects images missing alt attributes and generates descriptive text using Gemini vision AI.',
    icon: '🖼️',
    wcag: '1.1.1 Non-text Content',
  },
  {
    id: 'formLabels',
    label: 'Form Labels',
    description: 'Identifies form controls without programmatic labels (aria-label, aria-labelledby, or <label>).',
    icon: '⌨️',
    wcag: '1.3.1 Info and Relationships',
  },
  {
    id: 'headingStructure',
    label: 'Heading Hierarchy',
    description: 'Validates sequential heading levels (h1→h2→h3) and generates corrected heading structure patches.',
    icon: '≡',
    wcag: '1.3.1 Info and Relationships',
  },
  {
    id: 'linkText',
    label: 'Link Text Quality',
    description: 'Flags vague or generic link text ("click here", "read more") and generates descriptive alternatives.',
    icon: '↗️',
    wcag: '2.4.4 Link Purpose (In Context)',
  },
];

export default function RuleConfiguration({ enabledRules, onRulesChange }) {
  const [animatingId, setAnimatingId] = useState(null);

  function toggleRule(ruleId) {
    setAnimatingId(ruleId);
    setTimeout(() => setAnimatingId(null), 300);
    onRulesChange({
      ...enabledRules,
      [ruleId]: !enabledRules[ruleId],
    });
  }

  const enabledCount = Object.values(enabledRules).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white/90">Rule Configuration</h2>
          <p className="mt-1 text-sm text-white/40">
            Enable or disable specific WCAG evaluators for your audits.
          </p>
        </div>
        <div className="rounded-full bg-accent-500/10 border border-accent-400/20 px-4 py-1.5 text-xs font-medium text-accent-400">
          {enabledCount} of {RULES.length} active
        </div>
      </div>

      <div className="space-y-3">
        {RULES.map((rule) => {
          const isEnabled = enabledRules[rule.id] !== false;
          const isAnimating = animatingId === rule.id;

          return (
            <div
              key={rule.id}
              className={`glass-card p-5 transition-all duration-300 ${isAnimating ? 'scale-[0.995]' : ''} ${
                isEnabled ? 'border-white/[0.08]' : 'border-white/[0.03] opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{rule.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white/90 text-sm">{rule.label}</h3>
                      <span className="inline-block mt-1 rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-white/35">
                        {rule.wcag}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${rule.label}`}
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400/30 ${
                        isEnabled ? 'bg-accent-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/40 leading-relaxed">{rule.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {enabledCount === 0 && (
        <div className="glass-card border-amber-500/20 p-5">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-amber-400 shrink-0">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-amber-300/80">
              All evaluators are disabled. Enable at least one rule to run meaningful audits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
