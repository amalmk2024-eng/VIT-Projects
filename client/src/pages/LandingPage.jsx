import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onRunQuickAudit }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [quickUrl, setQuickUrl] = useState('');

  function handleQuickSubmit(e) {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    onRunQuickAudit(quickUrl.trim());
    navigate('/audit');
  }

  function handleSampleAudit() {
    onRunQuickAudit(`${window.location.origin}/accessibility-fixture.html`);
    navigate('/audit');
  }

  return (
    <div className="space-y-24 py-10 animate-fade-in">
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto pt-8 pb-6">
        {/* Editorial Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-stone-200/90 px-4 py-1.5 text-xs font-medium text-charcoal-800 mb-8 shadow-subtle backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-sage-500 animate-pulse" />
          <span className="font-semibold text-charcoal-900">WCAG 2.2 Level AA Engine</span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-500">Google Gemini Multimodal AI</span>
        </div>

        {/* Main Heading with Serif Typography */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal-900 leading-[1.12]">
          Audit Websites & Generate <br />
          <span className="font-serif italic font-normal text-sage-800">
            Copy-Ready
          </span>{' '}
          Remediation Patches
        </h1>

        <p className="mt-6 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Traditional auditing tools merely catalog failures. A11yFix combines a hardened
          stealth browser with Google Gemini Multimodal AI to programmatically synthesize
          accessible HTML, CSS, and ARIA code patches in seconds.
        </p>

        {/* Floating Quick Scanner Card */}
        <div className="mt-10 glass-card p-3 max-w-2xl mx-auto shadow-float hover:shadow-elevated transition-all duration-300">
          <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                <svg width="19" height="19" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Enter any public URL (e.g. https://example.com)"
                className="w-full rounded-xl border border-stone-200/80 bg-stone-50/60 py-3.5 pl-11 pr-4 text-sm font-medium text-charcoal-900 placeholder-stone-400 outline-none transition-all focus:border-sage-500 focus:bg-white focus:ring-2 focus:ring-sage-400/20"
              />
            </div>
            <button
              type="submit"
              disabled={!quickUrl.trim()}
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap text-sm py-3.5 px-7"
            >
              <span>Instant Audit</span>
              <span>→</span>
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between px-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
              <span>Anti-bot stealth bypass active</span>
            </div>
            <button
              type="button"
              onClick={handleSampleAudit}
              className="text-sage-700 hover:text-sage-900 font-medium underline underline-offset-4 transition-colors"
            >
              Try sample fixture demo
            </button>
          </div>
        </div>

        {/* Quick Nav Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/audit"
            className="rounded-xl border border-stone-200/90 bg-white/80 px-5 py-2.5 text-xs font-semibold text-charcoal-800 shadow-sm hover:bg-white hover:border-stone-300 transition-all hover:-translate-y-0.5"
          >
            Launch Full Auditor Dashboard
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="rounded-xl border border-sage-200/90 bg-sage-50/80 px-5 py-2.5 text-xs font-semibold text-sage-800 shadow-sm hover:bg-sage-100 transition-all hover:-translate-y-0.5"
            >
              Register Developer Account
            </Link>
          ) : (
            <span className="text-xs text-stone-500">
              Authenticated as <strong className="text-charcoal-900">{user.name}</strong>
            </span>
          )}
        </div>
      </section>

      {/* ── Problem & Solution Metrics ──────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="glass-card p-7 text-center shadow-float">
          <div className="font-serif text-4xl font-bold text-rose-700">95.9%</div>
          <div className="mt-2 text-sm font-semibold text-charcoal-900">Homepages Fail WCAG</div>
          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            WebAIM research reveals nearly all top commercial web properties fail baseline
            accessibility criteria, exposing businesses to legal risk.
          </p>
        </div>

        <div className="glass-card p-7 text-center shadow-float">
          <div className="font-serif text-4xl font-bold text-sage-700">5 Categories</div>
          <div className="mt-2 text-sm font-semibold text-charcoal-900">Automated Remediation</div>
          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            Contrast shifts, vision alt-text, form labels, link anchors, and heading hierarchy
            are evaluated and repaired programmatically in parallel.
          </p>
        </div>

        <div className="glass-card p-7 text-center shadow-float">
          <div className="font-serif text-4xl font-bold text-charcoal-900">100% Code-Ready</div>
          <div className="mt-2 text-sm font-semibold text-charcoal-900">Instant HTML/CSS Patches</div>
          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            Directly copyable patches and exportable CSS stylesheets, eliminating hours of manual
            engineering and guesswork.
          </p>
        </div>
      </section>

      {/* ── Core Modules Grid ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-sage-800">
            Architectural Engine
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mt-2">
            Engineered for Modern Engineering Teams
          </h2>
          <p className="mt-3 text-sm text-stone-500 max-w-xl mx-auto">
            Advanced multi-tier architecture uniting headless scraping, mathematical algorithms, and multimodal vision models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🛡️"
            title="WAF Stealth Bypass"
            tag="FR1 • Puppeteer Stealth"
            desc="Emulates human desktop browser signatures and realistic viewports to bypass Cloudflare, Akamai, and bot detection systems."
          />
          <FeatureCard
            icon="🎨"
            title="Contrast Math Engine"
            tag="FR2 • Luminance & HSL"
            desc="Calculates relative sRGB luminance and shifts HSL lightness values until crossing strict WCAG AA 4.5:1 ratio thresholds."
          />
          <FeatureCard
            icon="🖼️"
            title="Gemini Vision Alt-Text"
            tag="FR3 • Multimodal AI"
            desc="Sends image buffers to Google Gemini vision models to automatically generate concise, screen-reader-friendly descriptions."
          />
          <FeatureCard
            icon="⌨️"
            title="Context-Aware Form Labels"
            tag="FR4 • Accessible Names"
            desc="Analyzes form controls, placeholders, and adjacent DOM elements to inject standards-compliant aria-label attributes."
          />
          <FeatureCard
            icon="≡"
            title="Heading Tree Correction"
            tag="FR5 • Sequential Semantics"
            desc="Traverses DOM heading hierarchies, detects skipped levels (e.g. h1 to h3), and generates re-mapped HTML tags."
          />
          <FeatureCard
            icon="📦"
            title="Export & History Engine"
            tag="FR6 • Multi-Format Suite"
            desc="Persists past audit scores and exports copy-ready CSS patches, JSON payloads, and standalone styled HTML reports."
          />
        </div>
      </section>

      {/* ── Before & After Code Preview ─────────────────────────────── */}
      <section className="max-w-4xl mx-auto glass-card p-8 sm:p-10 shadow-float">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-sage-800 font-semibold">
            Programmatic Remediation
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
            From Violation to Production-Ready Patch
          </h3>
          <p className="text-xs text-stone-500 mt-2">
            See how A11yFix transforms failing legacy markup into standards-compliant code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 text-xs font-mono">
            <div className="flex items-center justify-between text-rose-800 font-bold mb-3 pb-2 border-b border-rose-200/60">
              <span>✕ Failing Markup (WCAG Violation)</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-sans">
                Initial
              </span>
            </div>
            <pre className="text-charcoal-700 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
{`<!-- 1. Color Contrast: 2.1:1 (FAIL) -->
<button style="color: #999; background: #fff">
  Submit Form
</button>

<!-- 2. Missing Alt Text -->
<img src="/user-avatar.png">

<!-- 3. Ambiguous Anchor Link -->
<a href="/pricing">Click here</a>`}
            </pre>
          </div>

          <div className="rounded-2xl border border-sage-200/80 bg-sage-50/40 p-5 text-xs font-mono">
            <div className="flex items-center justify-between text-sage-800 font-bold mb-3 pb-2 border-b border-sage-200/60">
              <span>✓ A11yFix Remediated Patch</span>
              <span className="text-[10px] bg-sage-100 text-sage-800 px-2 py-0.5 rounded-full font-sans">
                Remediated
              </span>
            </div>
            <pre className="text-charcoal-800 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
{`/* 1. Compliant HSL Shift: 4.8:1 (PASS) */
button { color: #595959; }

<!-- 2. AI-Generated Alt Description -->
<img src="/user-avatar.png" 
     alt="Smiling professional in modern office">

<!-- 3. Contextual Anchor Text -->
<a href="/pricing">View subscription plans</a>`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Call To Action Section ──────────────────────────────────── */}
      <section className="text-center max-w-2xl mx-auto py-8">
        <h3 className="font-serif text-3xl font-bold text-charcoal-900">
          Ready to audit your web application?
        </h3>
        <p className="mt-2 text-sm text-stone-500">
          Run your first automated WCAG 2.2 scan in under 30 seconds.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/audit" className="btn-primary text-sm px-8 py-3.5">
            Launch Auditor Dashboard
          </Link>
          <Link
            to="/docs"
            className="rounded-xl border border-stone-200/90 bg-white px-7 py-3.5 text-sm font-semibold text-charcoal-800 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all hover:-translate-y-0.5"
          >
            Read Guidelines & Math
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, tag, desc }) {
  return (
    <div className="glass-card-hover p-6 shadow-float group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] font-mono font-medium text-stone-500 bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 rounded-full">
          {tag}
        </span>
      </div>
      <h3 className="font-serif font-bold text-charcoal-900 text-base group-hover:text-sage-800 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-xs text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}
