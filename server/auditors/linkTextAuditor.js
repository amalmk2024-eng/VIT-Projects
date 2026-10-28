async function linkTextAuditor(page) {
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const vaguePhrase = /\b(click here|read more|learn more)\b/i;
    const genericOnly = /^(more|here|link)[.!?…]*$/i;
    const findings = anchors
      .filter((anchor) => {
        const text = (anchor.innerText || anchor.textContent || '').trim().replace(/\s+/g, ' ');
        return text && (vaguePhrase.test(text) || genericOnly.test(text));
      })
      .map((anchor) => {
        const contextElement = anchor.closest('p, li, section, article') || anchor.parentElement;
        const contextHeading = contextElement?.querySelector('h1, h2, h3, h4, h5, h6');
        return {
          href: anchor.href,
          text: (anchor.innerText || anchor.textContent || '').trim().substring(0, 160),
          context: (contextElement?.innerText || '').trim().substring(0, 400),
          heading: contextHeading?.innerText?.trim() || '',
          selector: anchor.id ? `a#${CSS.escape(anchor.id)}` : 'a[href]',
          originalHTML: anchor.outerHTML.substring(0, 600),
        };
      });
    return { findings, scanned: anchors.length };
  });
}

module.exports = { linkTextAuditor };