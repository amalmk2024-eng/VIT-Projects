import { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Header from './components/Header';
import URLInput from './components/URLInput';
import SummaryCard from './components/SummaryCard';
import TabView from './components/TabView';
import ContrastFixes from './components/ContrastFixes';
import AltTextFixes from './components/AltTextFixes';
import HeadingFixes from './components/HeadingFixes';
import ReportDownloads from './components/ReportDownloads';
import { FormLabelFixes, LinkTextFixes } from './components/ContextualFixes';
import { apiFetch } from './api';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AuditHistory from './pages/AuditHistory';
import RuleConfiguration from './pages/RuleConfiguration';
import ExportCenter from './pages/ExportCenter';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';

export default function App() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('contrast');
  const [auditUrl, setAuditUrl] = useState('');

  const [enabledRules, setEnabledRules] = useState({
    contrast: true,
    altText: true,
    formLabels: true,
    headingStructure: true,
    linkText: true,
  });

  const activeRuleCount = Object.values(enabledRules).filter(Boolean).length;

  async function handleAudit(url) {
    if (!url) return;
    setAuditUrl(url);
    setLoading(true);
    setError(null);
    setResults(null);

    const token = localStorage.getItem('a11yfix_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const { response: res, data } = await apiFetch('/api/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, enabledRules }),
      });

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Audit failed unexpectedly.');
      }

      setResults(data);
      const resultTabs = [
        ['contrast', data.results?.contrastFixes],
        ['alttext', data.results?.altTextFixes],
        ['forms', data.results?.formLabelFixes],
        ['links', data.results?.linkTextFixes],
        ['headings', data.results?.headingFixes],
      ];
      setActiveTab(resultTabs.find(([, fixes]) => fixes?.length)?.[0] || 'contrast');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFromHistory(url) {
    navigate('/audit');
    handleAudit(url);
  }

  return (
    <div className="app-shell min-h-screen pb-20">
      <Header activeRuleCount={activeRuleCount} hasResults={Boolean(results)} />

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<LandingPage onRunQuickAudit={handleAudit} />} />
          <Route
            path="/audit"
            element={
              <AuditorDashboard
                auditUrl={auditUrl}
                loading={loading}
                error={error}
                results={results}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onAudit={handleAudit}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/history"
            element={<AuditHistory onSelectAudit={handleSelectFromHistory} />}
          />
          <Route
            path="/rules"
            element={
              <RuleConfiguration
                enabledRules={enabledRules}
                onRulesChange={setEnabledRules}
              />
            }
          />
          <Route path="/export" element={<ExportCenter report={results} />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/** Dashboard view containing URL Input, Skeletons, and Results */
function AuditorDashboard({
  auditUrl,
  loading,
  error,
  results,
  activeTab,
  setActiveTab,
  onAudit,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900">Audit & Remediation Dashboard</h2>
          <p className="mt-1 text-xs text-stone-500">
            Submit any public URL to initiate a full WCAG 2.2 scan with copy-ready code fixes.
          </p>
        </div>
      </div>

      <URLInput onSubmit={onAudit} loading={loading} initialUrl={auditUrl} />

      {/* Error State */}
      {error && (
        <div className={`animate-fade-in glass-card p-6 ${
          error.includes('anti-bot or security challenge') ||
          error.includes('kept changing pages while loading')
            ? 'border-amber-200 bg-amber-50/70'
            : 'border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 ${
              error.includes('anti-bot or security challenge') ||
              error.includes('kept changing pages while loading')
                ? 'text-amber-700'
                : 'text-red-400'
            }`}>
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <h3 className="font-semibold text-charcoal-900">
                {error.includes('anti-bot or security challenge') ||
                error.includes('kept changing pages while loading')
                  ? 'Target page is protected'
                  : 'Audit Failed'}
              </h3>
              <p className="mt-1 text-sm text-stone-600">{error}</p>
              {(error.includes('anti-bot or security challenge') ||
                error.includes('kept changing pages while loading')) && (
                <p className="mt-3 text-xs font-medium text-stone-500">
                  Try the sample fixture or a public page that loads without a CAPTCHA.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      {results && !loading && (
        <div className="animate-slide-up space-y-8">
          <SummaryCard summary={results.summary} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white/90">
                Remediation findings
              </h2>
              <p className="mt-1 text-xs text-white/40">
                Review and export the generated patches.
              </p>
            </div>
            <ReportDownloads report={results} />
          </div>

          <TabView
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              contrastFixes: results.results?.contrastFixes?.length || 0,
              altTextFixes: results.results?.altTextFixes?.length || 0,
              formLabelFixes: results.results?.formLabelFixes?.length || 0,
              linkTextFixes: results.results?.linkTextFixes?.length || 0,
              headingFixes: results.results?.headingFixes?.length || 0,
            }}
          />

          {activeTab === 'contrast' && (
            <ContrastFixes fixes={results.results?.contrastFixes || []} />
          )}
          {activeTab === 'alttext' && (
            <AltTextFixes fixes={results.results?.altTextFixes || []} />
          )}
          {activeTab === 'forms' && (
            <FormLabelFixes
              fixes={results.results?.formLabelFixes || []}
              scanned={results.summary.scannedControls}
            />
          )}
          {activeTab === 'links' && (
            <LinkTextFixes fixes={results.results?.linkTextFixes || []} />
          )}
          {activeTab === 'headings' && (
            <HeadingFixes
              fixes={results.results?.headingFixes || []}
              trees={results.results?.headingTrees}
              scanned={results.summary.scannedHeadings}
            />
          )}
        </div>
      )}

      {!results && !loading && !error && (
        <LandingHero
          onSampleAudit={() =>
            onAudit(`${window.location.origin}/accessibility-fixture.html`)
          }
        />
      )}
    </div>
  );
}

/** Skeleton loading placeholders */
function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <div className="text-center">
            <p className="text-lg font-semibold text-charcoal-900">Auditing website…</p>
            <p className="mt-2 text-sm text-stone-500">
              Launching headless browser with stealth mode, scanning DOM, running WCAG checks & Gemini AI.
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Hero section shown on /audit before first scan */
function LandingHero({ onSampleAudit }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-500/20 to-cyan-500/20 border border-accent-400/20">
        <svg
          width="40"
          height="40"
          fill="none"
          viewBox="0 0 24 24"
          className="text-accent-400"
        >
          <path
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold gradient-text">Paste a URL above to begin</h3>
      <p className="mt-3 max-w-lg text-sm text-stone-500 leading-relaxed">
        A11yFix launches a hardened headless browser to render the page, scan the DOM for
        WCAG 2.2 violations, and generate programmatic remediation patches — all automatically.
      </p>
      <button type="button" className="btn-primary mt-6 text-sm px-6 py-3" onClick={onSampleAudit}>
        Run sample fixture audit
      </button>
    </div>
  );
}
