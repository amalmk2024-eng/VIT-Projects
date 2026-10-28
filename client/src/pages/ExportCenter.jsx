import { useState } from 'react';

export default function ExportCenter({ report }) {
  const [downloadedFormat, setDownloadedFormat] = useState(null);

  if (!report) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-white/90">Export Center</h2>
          <p className="mt-1 text-sm text-white/40">
            Download complete remediation reports after running an audit.
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <div className="mb-4 text-4xl">📦</div>
          <h3 className="text-lg font-semibold text-white/60">No report available</h3>
          <p className="mt-2 text-sm text-white/30">
            Run an audit from the Dashboard first, then return here to export the results.
          </p>
        </div>
      </div>
    );
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function downloadJson() {
    downloadFile('a11yfix-remediation-report.json', JSON.stringify(report, null, 2), 'application/json');
    setDownloadedFormat('json');
    setTimeout(() => setDownloadedFormat(null), 2000);
  }

  function downloadHtml() {
    const summary = report.summary || {};
    const violations = report.violations || {};
    const results = report.results || {};

    const contrastCss = (results.contrastFixes || []).map((fix) =>
      `/* Fix: ${escapeHtml(fix.selector)} */\n${escapeHtml(fix.selector)} {\n  color: ${escapeHtml(fix.remediated.fgHex)};\n}`
    ).join('\n\n');

    const altTextHtml = (results.altTextFixes || [])
      .filter((f) => f.remediatedHTML)
      .map((f) => `<!-- Image: ${escapeHtml(f.src)} -->\n${escapeHtml(f.remediatedHTML)}`)
      .join('\n\n');

    const headingHtml = (results.headingFixes || [])
      .filter((f) => f.remediatedHTML)
      .map((f) => `<!-- ${escapeHtml(f.issue || '')} -->\n${escapeHtml(f.remediatedHTML)}`)
      .join('\n\n');

    const formLabelHtml = (results.formLabelFixes || [])
      .filter((f) => f.remediatedHTML)
      .map((f) => `<!-- ${escapeHtml(f.element || '')} -->\n${escapeHtml(f.remediatedHTML)}`)
      .join('\n\n');

    const linkTextHtml = (results.linkTextFixes || [])
      .filter((f) => f.remediatedHTML)
      .map((f) => `<!-- ${escapeHtml(f.href || '')} -->\n${escapeHtml(f.remediatedHTML)}`)
      .join('\n\n');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A11yFix Remediation Report — ${escapeHtml(summary.url || '')}</title>
<style>
  :root { --bg: #0f1225; --card: #171b36; --text: #f0f1f8; --muted: #636985; --accent: #6366f1; --success: #10b981; --fail: #ef4444; }
  * { box-sizing: border-box; margin: 0; }
  body { font: 15px/1.7 'Inter', system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 24px; background: var(--bg); color: var(--text); }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 18px; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .meta { color: var(--muted); font-size: 13px; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 32px; }
  .stat { background: var(--card); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .grade-a, .grade-b { color: var(--success); }
  .grade-c { color: #f59e0b; }
  .grade-d { color: #f97316; }
  .grade-f { color: var(--fail); }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #0d0f20; padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); font: 13px/1.6 'JetBrains Mono', monospace; color: #c4b5fd; margin: 8px 0 16px; }
  .section-empty { color: var(--muted); font-style: italic; padding: 12px 0; }
</style>
</head>
<body>
<h1>A11yFix Remediation Report</h1>
<p class="meta">URL: ${escapeHtml(summary.url || '')} &bull; Generated: ${escapeHtml(new Date().toLocaleString())} &bull; Page: ${escapeHtml(summary.pageTitle || '')}</p>

<div class="summary">
  <div class="stat">
    <div class="stat-label">Grade</div>
    <div class="stat-value grade-${(summary.grade || 'f').toLowerCase()}">${escapeHtml(summary.grade || 'N/A')}</div>
  </div>
  <div class="stat">
    <div class="stat-label">Violations</div>
    <div class="stat-value" style="color: var(--fail)">${summary.totalErrors || 0}</div>
  </div>
  <div class="stat">
    <div class="stat-label">Auto-Fixed</div>
    <div class="stat-value" style="color: var(--success)">${summary.totalFixed || 0}</div>
  </div>
</div>

<h2>CSS Contrast Fixes (${(results.contrastFixes || []).length})</h2>
${contrastCss ? `<pre>${contrastCss}</pre>` : '<p class="section-empty">No contrast violations found.</p>'}

<h2>Alt-Text Patches (${(results.altTextFixes || []).filter((f) => f.remediatedHTML).length})</h2>
${altTextHtml ? `<pre>${altTextHtml}</pre>` : '<p class="section-empty">No missing alt-text detected.</p>'}

<h2>Heading Fixes (${(results.headingFixes || []).filter((f) => f.remediatedHTML).length})</h2>
${headingHtml ? `<pre>${headingHtml}</pre>` : '<p class="section-empty">Heading hierarchy is correct.</p>'}

<h2>Form Label Patches (${(results.formLabelFixes || []).filter((f) => f.remediatedHTML).length})</h2>
${formLabelHtml ? `<pre>${formLabelHtml}</pre>` : '<p class="section-empty">All controls are labeled.</p>'}

<h2>Link Text Fixes (${(results.linkTextFixes || []).filter((f) => f.remediatedHTML).length})</h2>
${linkTextHtml ? `<pre>${linkTextHtml}</pre>` : '<p class="section-empty">No vague link text detected.</p>'}

<h2>Raw JSON Data</h2>
<pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>
</body>
</html>`;
    downloadFile('a11yfix-remediation-report.html', html, 'text/html');
    setDownloadedFormat('html');
    setTimeout(() => setDownloadedFormat(null), 2000);
  }

  function downloadCssPatch() {
    const patches = (report.results?.contrastFixes || []).map((fix) =>
      `/* WCAG 2.2 AA Contrast Fix — ${fix.selector} */\n/* Original: ${fix.original.fgHex} on ${fix.original.bgHex} → ${fix.original.ratio}:1 (FAIL) */\n/* Fixed:    ${fix.remediated.fgHex} on ${fix.remediated.bgHex} → ${fix.remediated.ratio}:1 (PASS) */\n\n${fix.selector} {\n  color: ${fix.remediated.fgHex};\n}`
    ).join('\n\n');
    downloadFile('a11yfix-contrast-fixes.css', patches || '/* No contrast fixes needed */', 'text/css');
    setDownloadedFormat('css');
    setTimeout(() => setDownloadedFormat(null), 2000);
  }

  const summary = report.summary || {};
  const contrastCount = report.results?.contrastFixes?.length || 0;
  const altTextCount = report.results?.altTextFixes?.filter((f) => f.remediatedHTML)?.length || 0;
  const totalPatches = contrastCount + altTextCount +
    (report.results?.headingFixes?.filter((f) => f.remediatedHTML)?.length || 0) +
    (report.results?.formLabelFixes?.filter((f) => f.remediatedHTML)?.length || 0) +
    (report.results?.linkTextFixes?.filter((f) => f.remediatedHTML)?.length || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white/90">Export Center</h2>
        <p className="mt-1 text-sm text-white/40">
          Download remediation reports containing generated CSS/HTML code patches.
        </p>
      </div>

      {/* Report Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 border border-accent-400/20">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-accent-400">
              <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white/90">{summary.url || 'Audit Report'}</h3>
            <p className="text-xs text-white/40">
              Grade {summary.grade} • {summary.totalErrors} violations • {totalPatches} patches generated
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExportButton
            label="JSON Report"
            description="Complete audit data with all findings and patches"
            icon="📄"
            onClick={downloadJson}
            active={downloadedFormat === 'json'}
          />
          <ExportButton
            label="HTML Report"
            description="Styled report with CSS/HTML code blocks for review"
            icon="🌐"
            onClick={downloadHtml}
            active={downloadedFormat === 'html'}
          />
          <ExportButton
            label="CSS Patches"
            description={`${contrastCount} contrast fix${contrastCount !== 1 ? 'es' : ''} as a CSS file`}
            icon="🎨"
            onClick={downloadCssPatch}
            active={downloadedFormat === 'css'}
          />
        </div>
      </div>

      {/* Patch Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white/80 mb-4">Patch Breakdown</h3>
        <div className="space-y-3">
          <PatchRow label="Contrast CSS Fixes" count={contrastCount} color="text-cyan-400" />
          <PatchRow label="Alt-Text HTML Patches" count={altTextCount} color="text-emerald-400" />
          <PatchRow label="Heading Structure Fixes" count={report.results?.headingFixes?.filter((f) => f.remediatedHTML)?.length || 0} color="text-amber-400" />
          <PatchRow label="Form Label Patches" count={report.results?.formLabelFixes?.filter((f) => f.remediatedHTML)?.length || 0} color="text-purple-400" />
          <PatchRow label="Link Text Updates" count={report.results?.linkTextFixes?.filter((f) => f.remediatedHTML)?.length || 0} color="text-orange-400" />
        </div>
      </div>
    </div>
  );
}

function ExportButton({ label, description, icon, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all duration-300 hover:border-accent-400/30 hover:bg-accent-500/5 ${
        active
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <span className="text-xl">{active ? '✅' : icon}</span>
      <p className="mt-2 text-sm font-medium text-white/80">{active ? 'Downloaded!' : label}</p>
      <p className="mt-1 text-[11px] text-white/35">{description}</p>
    </button>
  );
}

function PatchRow({ label, count, color }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
      <span className="text-sm text-white/60">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{count}</span>
    </div>
  );
}
