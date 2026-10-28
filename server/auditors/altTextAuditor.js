async function altTextAuditor(page) {
  return page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const findings = images
      .filter((image) => {
        const alt = image.getAttribute('alt');
        return visible(image) && (alt === null || alt.trim() === '');
      })
      .map((image) => ({
        src: image.currentSrc || image.src || image.getAttribute('src') || '',
        originalHTML: image.outerHTML.substring(0, 500),
        hasAlt: image.hasAttribute('alt'),
        altValue: image.getAttribute('alt'),
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        title: image.getAttribute('title') || '',
        context: (
          image.closest('figure')?.querySelector('figcaption')?.innerText ||
          image.parentElement?.getAttribute('aria-label') ||
          image.parentElement?.innerText ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 240),
      }));
    return { findings, scanned: images.filter(visible).length };
  });
}

module.exports = { altTextAuditor };