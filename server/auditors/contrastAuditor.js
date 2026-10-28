const { analyzeAndRemediate } = require('../services/contrastEngine');

async function contrastAuditor(page) {
  const textElements = await page.evaluate(() => {
    const elements = [];
    const selectorFor = (element) => {
      const parts = [];
      let current = element;
      while (current && current !== document.body && parts.length < 5) {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          parts.unshift(`${part}#${CSS.escape(current.id)}`);
          break;
        }
        const classes = Array.from(current.classList).slice(0, 2);
        if (classes.length) {
          part += classes.map((name) => `.${CSS.escape(name)}`).join('');
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(' > ');
    };
    const isTransparent = (color) =>
      color === 'transparent' || /,\s*0\s*\)$/.test(color);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNode;

    while ((textNode = walker.nextNode())) {
      const text = textNode.textContent.trim();
      const element = textNode.parentElement;
      if (!element || text.length < 2) continue;

      let current = element;
      let hidden = false;
      while (current) {
        const currentStyle = getComputedStyle(current);
        if (
          currentStyle.display === 'none' ||
          currentStyle.visibility === 'hidden' ||
          currentStyle.visibility === 'collapse' ||
          currentStyle.opacity === '0'
        ) {
          hidden = true;
          break;
        }
        current = current.parentElement;
      }
      if (hidden) continue;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      const style = getComputedStyle(element);
      let backgroundColor = style.backgroundColor;
      current = element.parentElement;
      while (current && isTransparent(backgroundColor)) {
        backgroundColor = getComputedStyle(current).backgroundColor;
        current = current.parentElement;
      }
      if (isTransparent(backgroundColor)) backgroundColor = 'rgb(255, 255, 255)';

      elements.push({
        text: text.substring(0, 120),
        tagName: element.tagName.toLowerCase(),
        selector: selectorFor(element),
        color: style.color,
        backgroundColor,
        fontSize: parseFloat(style.fontSize),
        fontWeight: parseInt(style.fontWeight, 10) || 400,
      });
    }
    return elements;
  });

  return {
    fixes: analyzeAndRemediate(textElements),
    scanned: textElements.length,
  };
}

module.exports = { contrastAuditor };