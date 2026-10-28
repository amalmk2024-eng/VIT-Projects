export default function Documentation() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white/90">Documentation & Guidelines</h2>
        <p className="mt-1 text-sm text-white/40">
          WCAG 2.2 criteria enforced by A11yFix, contrast mathematics, and accessibility standards reference.
        </p>
      </div>

      {/* WCAG 2.2 Overview */}
      <section className="glass-card p-6">
        <h3 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 text-sm">§</span>
          WCAG 2.2 Level AA Criteria
        </h3>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          The Web Content Accessibility Guidelines (WCAG) 2.2 define how to make web content more accessible
          to people with disabilities. A11yFix enforces the following Level AA success criteria:
        </p>
        <div className="space-y-3">
          <CriterionCard
            number="1.1.1"
            title="Non-text Content"
            level="A"
            description="All non-text content (images, icons, charts) must have a text alternative that serves the equivalent purpose. A11yFix detects images with missing or empty alt attributes and uses Gemini AI vision to generate concise, screen-reader-friendly descriptions."
            evaluator="Image Alt-Text Auditor"
          />
          <CriterionCard
            number="1.3.1"
            title="Info and Relationships"
            level="A"
            description="Information, structure, and relationships conveyed through presentation must be programmatically determinable. A11yFix validates heading hierarchy (h1→h2→h3) to ensure sequential levels and checks that form controls have associated labels."
            evaluator="Heading Hierarchy & Form Label Auditors"
          />
          <CriterionCard
            number="1.4.3"
            title="Contrast (Minimum)"
            level="AA"
            description="Text must have a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (≥18pt or ≥14pt bold). A11yFix measures actual computed foreground and background colors and calculates the precise WCAG luminance-based contrast ratio."
            evaluator="Color Contrast Auditor"
          />
          <CriterionCard
            number="2.4.4"
            title="Link Purpose (In Context)"
            level="A"
            description='The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined context. A11yFix flags vague text like "click here" or "read more" and generates descriptive alternatives.'
            evaluator="Link Text Auditor"
          />
          <CriterionCard
            number="2.4.6"
            title="Headings and Labels"
            level="AA"
            description="Headings and labels must describe their topic or purpose. A11yFix ensures heading elements follow a logical hierarchy without skipped levels."
            evaluator="Heading Hierarchy Auditor"
          />
        </div>
      </section>

      {/* Contrast Math */}
      <section className="glass-card p-6">
        <h3 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">∑</span>
          Contrast Ratio Mathematics
        </h3>
        <div className="space-y-5">
          <DocBlock
            title="Relative Luminance (sRGB Linearization)"
            content={`WCAG 2.2 defines relative luminance using the IEC 61966-2-1 sRGB transfer function.

For each color channel C ∈ {R, G, B} where C ranges from 0 to 255:

  C_sRGB = C / 255
  C_linear = C_sRGB ≤ 0.04045
    ? C_sRGB / 12.92
    : ((C_sRGB + 0.055) / 1.055) ^ 2.4

Then:
  L = 0.2126 × R_linear + 0.7152 × G_linear + 0.0722 × B_linear

Where L is the relative luminance on a scale of 0 (darkest black) to 1 (lightest white).`}
          />
          <DocBlock
            title="Contrast Ratio Formula"
            content={`The contrast ratio between two colors is:

  Ratio = (L_lighter + 0.05) / (L_darker + 0.05)

Where L_lighter is the relative luminance of the lighter color and L_darker is the relative luminance of the darker color.

WCAG 2.2 AA thresholds:
  • Normal text (< 18pt or < 14pt bold): ratio ≥ 4.5:1
  • Large text (≥ 18pt or ≥ 14pt bold):  ratio ≥ 3.0:1`}
          />
          <DocBlock
            title="HSL Color Space Remediation"
            content={`A11yFix remediates failing contrast by adjusting the foreground color's Lightness in HSL space, preserving the original Hue and Saturation.

Algorithm:
  1. Convert failing foreground color from RGB → HSL
  2. Determine direction: darken text on light backgrounds, lighten on dark
  3. Step lightness by 0.5% increments until contrast ratio ≥ threshold
  4. If primary direction fails, try the opposite direction
  5. Last resort: fall back to pure black (#000000) or white (#ffffff)

This preserves the designer's intent (color hue) while ensuring accessibility.`}
          />
          <DocBlock
            title="OKLCH Color Space (Advanced)"
            content={`OKLCH is a perceptually uniform color space offering more predictable lightness adjustments than HSL. It uses three components:

  • L (Lightness): 0 to 1, perceptually uniform
  • C (Chroma): 0 to ~0.4, represents color intensity
  • H (Hue): 0 to 360 degrees

While A11yFix currently uses HSL for its contrast remediation, OKLCH provides superior perceptual uniformity — adjusting L in OKLCH produces more visually consistent results across different hues.

CSS native OKLCH support: oklch(L C H) is supported in all modern browsers.`}
          />
        </div>
      </section>

      {/* Accessibility Standards */}
      <section className="glass-card p-6">
        <h3 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">📚</span>
          Reference Standards
        </h3>
        <div className="space-y-3">
          <ReferenceLink
            title="WCAG 2.2 Specification"
            url="https://www.w3.org/TR/WCAG22/"
            description="The full W3C Web Content Accessibility Guidelines 2.2 recommendation."
          />
          <ReferenceLink
            title="Understanding WCAG 2.2"
            url="https://www.w3.org/WAI/WCAG22/Understanding/"
            description="Detailed explanations and intent behind each success criterion."
          />
          <ReferenceLink
            title="WCAG 2.2 Techniques"
            url="https://www.w3.org/WAI/WCAG22/Techniques/"
            description="Sufficient and advisory techniques for meeting each criterion."
          />
          <ReferenceLink
            title="ARIA Authoring Practices"
            url="https://www.w3.org/WAI/ARIA/apg/"
            description="Guidance on using WAI-ARIA for accessible web interfaces."
          />
          <ReferenceLink
            title="Section 508 Standards"
            url="https://www.section508.gov/"
            description="U.S. federal accessibility requirements for electronic and information technology."
          />
        </div>
      </section>
    </div>
  );
}

function CriterionCard({ number, title, level, description, evaluator }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1]">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center rounded-full bg-accent-500/10 border border-accent-400/20 px-2.5 py-0.5 text-[11px] font-bold text-accent-400">
          {number}
        </span>
        <h4 className="text-sm font-semibold text-white/80">{title}</h4>
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/35">
          Level {level}
        </span>
      </div>
      <p className="text-xs text-white/45 leading-relaxed">{description}</p>
      <p className="mt-2 text-[11px] text-accent-400/60">
        Enforced by: {evaluator}
      </p>
    </div>
  );
}

function DocBlock({ title, content }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white/70 mb-2">{title}</h4>
      <pre className="code-block overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}

function ReferenceLink({ title, url, description }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04] hover:border-accent-400/20 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white/80 group-hover:text-accent-400 transition-colors">{title}</h4>
          <p className="mt-1 text-xs text-white/40">{description}</p>
        </div>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white/20 group-hover:text-accent-400 transition-colors shrink-0">
          <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
