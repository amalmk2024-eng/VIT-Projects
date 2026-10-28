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

export default function ReportDownloads({ report }) {
  function downloadJson() {
    downloadFile(
      'a11yfix-remediation-report.json',
      JSON.stringify(report, null, 2),
      'application/json'
    );
  }

  function downloadHtml() {
    const data = escapeHtml(JSON.stringify(report, null, 2));
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A11yFix Remediation Report</title>
<style>
  body { font: 15px/1.6 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 960px; margin: 40px auto; padding: 0 24px; color: #18181B; background: #FAF9F5; }
  h1 { font-family: Georgia, serif; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
  p { color: #52525B; font-size: 13px; margin-bottom: 24px; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #FFFFFF; padding: 20px; border-radius: 12px; border: 1px solid #E4DFD7; font-family: monospace; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
</style>
</head>
<body>
<h1>A11yFix Remediation Report</h1>
<p>Generated ${escapeHtml(new Date().toLocaleString())} &bull; WCAG 2.2 AA Compliance Engine</p>
<pre>${data}</pre>
</body>
</html>`;
    downloadFile('a11yfix-remediation-report.html', html, 'text/html');
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Download remediation report">
      <button
        type="button"
        onClick={downloadJson}
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-charcoal-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-300"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-stone-400">
          <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Export JSON</span>
      </button>
      <button
        type="button"
        onClick={downloadHtml}
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-charcoal-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-300"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-stone-400">
          <path stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export HTML</span>
      </button>
    </div>
  );
}