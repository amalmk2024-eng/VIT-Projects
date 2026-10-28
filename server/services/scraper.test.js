const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { scrapeUrl } = require('./scraper');
const auditRouter = require('../routes/audit');
const { retryGeminiRequest, createAltTextFallback } = require('./geminiService');

test('retries transient Gemini overloads with backoff', async () => {
  let attempts = 0;
  const delays = [];
  const result = await retryGeminiRequest(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error(
          '{"error":{"code":503,"status":"UNAVAILABLE","message":"high demand"}}'
        );
      }
      return 'generated';
    },
    { delay: async (milliseconds) => delays.push(milliseconds) }
  );

  assert.equal(result, 'generated');
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test('does not retry non-transient Gemini errors', async () => {
  let attempts = 0;
  await assert.rejects(
    retryGeminiRequest(async () => {
      attempts += 1;
      throw new Error('{"error":{"code":404,"status":"NOT_FOUND"}}');
    }, { delay: async () => {} })
  );
  assert.equal(attempts, 1);
});

test('stops Gemini requests during daily quota cooldown', async () => {
  let attempts = 0;
  const quotaError = new Error(JSON.stringify({
    error: {
      code: 429,
      message: 'You exceeded your current quota. Quota exceeded for free tier daily requests.',
      status: 'RESOURCE_EXHAUSTED',
      details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '63879s' }],
    },
  }));
  const request = async () => {
    attempts += 1;
    throw quotaError;
  };

  await assert.rejects(retryGeminiRequest(request), /daily quota is exhausted.*17h 45m/i);
  await assert.rejects(retryGeminiRequest(request), /daily quota is exhausted/i);
  assert.equal(attempts, 1);
});

test('creates reviewable image-context drafts or requests manual alt text', () => {
  const image = {
    src: 'https://images.example.test/garden.jpg',
    originalHTML: '<img src="garden.jpg" title="Community garden beds in spring">',
    title: 'Community garden beds in spring',
  };
  const draft = createAltTextFallback(image, 'Gemini quota exhausted.');
  const manual = createAltTextFallback(
    { src: image.src, originalHTML: '<img src="garden.jpg">' },
    'Gemini quota exhausted.'
  );

  assert.equal(draft.status, 'fallback');
  assert.equal(draft.altText, 'Community garden beds in spring');
  assert.match(draft.remediatedHTML, /alt="Community garden beds in spring"/);
  assert.equal(manual.status, 'manual-review');
  assert.equal(manual.remediatedHTML, null);
});

test('runs five evaluators against rendered visible DOM', async () => {
  const html =
    '<html><body><div id="direct">Direct text <span>nested text</span></div>' +
    '<p style="display:none">hidden text</p>' +
    '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />' +
    '<form><input type="hidden" id="hidden" />' +
    '<input type="submit" value="Send" /><input type="button" value="Cancel" />' +
    '<input id="unlabeled" name="email" placeholder="Email address" />' +
    '<label for="labeled">Name</label><input id="labeled" />' +
    '<input aria-label="Search" /></form>' +
    '<p>Read the announcement <a href="/announcement">Click here</a>.</p>' +
    '<a href="/read">Read more</a><a href="/learn">Learn more</a>' +
    '<a href="/details">More information</a><a href="/work">Learn about our work</a>' +
    '<h1>Page title</h1><h3 id="skipped" class="section-title">Skipped level</h3>' +
    '<h2>Next section</h2>' +
    '</body></html>';
  const result = await scrapeUrl(`data:text/html,${encodeURIComponent(html)}`);
  const { audits } = result;
  const text = audits.contrast.scanned;

  assert.ok(text >= 5);
  assert.equal(audits.altText.findings.length, 1);
  assert.equal(audits.formLabels.findings.length, 1);
  assert.equal(audits.formLabels.findings[0].id, 'unlabeled');
  assert.equal(audits.formLabels.findings[0].element, 'input');
  assert.match(audits.formLabels.findings[0].missingContext, /Email address/);
  assert.equal(audits.formLabels.scanned, 3);
  assert.equal(audits.linkText.findings.length, 3);
  assert.deepEqual(
    audits.linkText.findings.map((finding) => finding.text),
    ['Click here', 'Read more', 'Learn more']
  );
  assert.equal(audits.headingStructure.findings.length, 1);
  assert.equal(audits.headingStructure.findings[0].toLevel, 2);
  assert.equal(audits.headingStructure.findings[0].currentTag, 'h3');
  assert.equal(audits.headingStructure.findings[0].issue, 'Skipped heading level from h1 to h3');
  assert.equal(audits.headingStructure.findings[0].remediationPatch, 'Change tag to <h2>');
  assert.match(audits.headingStructure.findings[0].remediatedHTML, /id="skipped"/);
  assert.match(audits.headingStructure.findings[0].remediatedHTML, /class="section-title"/);
  assert.deepEqual(
    audits.headingStructure.correctedTree.map((heading) => heading.level),
    [1, 2, 2]
  );
});

test('audit route returns form and heading violations in the unified schema', async (t) => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
  const fixture = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'text/html');
    if (request.url === '/challenge') {
      response.end(
        '<!doctype html><html><head><title>Just a moment...</title></head>' +
          '<body>Performing security verification. Cloudflare Ray ID</body></html>'
      );
      return;
    }
    response.end(
      '<!doctype html><html><body><h1>Account</h1>' +
        '<form><input name="email" placeholder="Email address"></form>' +
        '<h3 id="details">Details</h3></body></html>'
    );
  });
  const app = express();
  app.use(express.json());
  app.use('/api/audit', auditRouter);
  const api = app.listen(0, '127.0.0.1');

  await Promise.all([
    new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve)),
    new Promise((resolve) => api.once('listening', resolve)),
  ]);

  t.after(async () => {
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
    await Promise.all(
      [fixture, api].map(
        (server) => new Promise((resolve) => server.close(resolve))
      )
    );
  });

  const fixtureUrl = `http://127.0.0.1:${fixture.address().port}`;
  const response = await fetch(`http://127.0.0.1:${api.address().port}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: fixtureUrl }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.url, `${fixtureUrl}/`);
  assert.equal(body.violations.formLabels.length, 1);
  assert.equal(body.violations.formLabels[0].element, 'input');
  assert.equal(body.violations.formLabels[0].type, 'text');
  assert.match(body.violations.formLabels[0].missingContext, /Email address/);
  assert.equal(body.violations.formLabels[0].label, 'Email address');
  assert.equal(body.violations.formLabels[0].status, 'fallback');
  assert.equal(body.violations.formLabels[0].remediationPatch, 'aria-label="Email address"');
  assert.match(body.violations.formLabels[0].remediatedHTML, /aria-label="Email address"/);
  assert.equal(body.violations.headings.length, 1);
  assert.deepEqual(body.violations.headings[0], {
    currentTag: 'h3',
    issue: 'Skipped heading level from h1 to h3',
    remediationPatch: 'Change tag to <h2>',
    text: 'Details',
    originalHTML: '<h3 id="details">Details</h3>',
    remediatedHTML: '<h2 id="details">Details</h2>',
  });

  const blockedResponse = await fetch(`http://127.0.0.1:${api.address().port}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: new URL('/challenge', fixtureUrl).href }),
  });
  const blockedBody = await blockedResponse.json();
  assert.equal(blockedResponse.status, 422);
  assert.match(blockedBody.error, /anti-bot or security challenge/);
});