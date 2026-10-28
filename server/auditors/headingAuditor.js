async function headingAuditor(page) {
  return page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    let previousOriginalLevel = 0;
    const originalTree = [];
    const correctedTree = [];
    const findings = [];

    headings.forEach((heading, index) => {
      const originalLevel = Number(heading.tagName.substring(1));
      const correctedLevel = previousLevel
        ? Math.min(originalLevel, previousLevel + 1)
        : originalLevel;
      const text = (heading.innerText || '').trim().substring(0, 200);
      const originalTag = heading.outerHTML.substring(0, 600);
      const remediatedHTML = heading.outerHTML
        .replace(/^<h[1-6]\b/i, `<h${correctedLevel}`)
        .replace(/<\/h[1-6]\s*>$/i, `</h${correctedLevel}>`);

      originalTree.push({ level: originalLevel, text });
      correctedTree.push({ level: correctedLevel, text });
      if (correctedLevel !== originalLevel) {
        findings.push({
          index,
          text,
          currentTag: `h${originalLevel}`,
          issue: `Skipped heading level from h${previousOriginalLevel} to h${originalLevel}`,
          remediationPatch: `Change tag to <h${correctedLevel}>`,
          fromLevel: originalLevel,
          toLevel: correctedLevel,
          originalHTML: originalTag,
          remediatedHTML,
        });
      }
      previousLevel = correctedLevel;
      previousOriginalLevel = originalLevel;
    });

    return { findings, originalTree, correctedTree, scanned: headings.length };
  });
}

module.exports = { headingAuditor };