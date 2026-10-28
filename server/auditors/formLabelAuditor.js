async function formLabelAuditor(page) {
  return page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter((control) => {
        if (control.tagName !== 'INPUT') return true;
        return !['hidden', 'submit', 'button'].includes(
          (control.getAttribute('type') || 'text').toLowerCase()
        );
      });
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const selectorFor = (element) => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const tag = element.tagName.toLowerCase();
      const name = element.getAttribute('name');
      return name ? `${tag}[name="${CSS.escape(name)}"]` : tag;
    };
    const findings = controls
      .filter(visible)
      .filter((control) => {
        const hasLabel = control.labels && control.labels.length > 0;
        const hasAriaLabel = Boolean(control.getAttribute('aria-label')?.trim());
        const hasAriaLabelledby = Boolean(control.getAttribute('aria-labelledby')?.trim());
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
      })
      .map((control) => ({
        element: control.tagName.toLowerCase(),
        selector: selectorFor(control),
        tagName: control.tagName.toLowerCase(),
        type:
          control.tagName === 'INPUT'
            ? control.getAttribute('type') || 'text'
            : control.tagName.toLowerCase(),
        id: control.id,
        name: control.getAttribute('name') || '',
        placeholder: control.getAttribute('placeholder') || '',
        context: (control.parentElement?.innerText || '').trim().substring(0, 300),
        originalHTML: control.outerHTML.substring(0, 500),
        missingContext: [
          control.getAttribute('placeholder'),
          (control.parentElement?.innerText || '').trim(),
          control.getAttribute('name'),
          control.id,
        ]
          .filter(Boolean)
          .join(' | ')
          .substring(0, 400),
      }));
    return { findings, scanned: controls.filter(visible).length };
  });
}

module.exports = { formLabelAuditor };