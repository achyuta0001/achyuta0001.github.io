// Renders the terminal transcripts in scripts/captures/*.txt into framed PNGs
// in src/assets/work/, which Astro then optimises for the Work section.
//
// The transcripts are real output, recorded by running the tools themselves:
//   tripwyre.txt  `tripwyre scan` on a sample project (an npm lockfile pinning
//                 express 4.17.1 and lodash 4.17.20, a prod config that drifted
//                 from its expected file, and a log with an error spike)
//   ashlar.txt    the ashlar CLI appending records, the store file truncated
//                 mid-record to simulate a crash, then reopening the log
// Re-record a transcript by re-running its commands; never edit the output.
//
// Usage: node scripts/make-captures.mjs
import { chromium } from '@playwright/test';
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, 'scripts/captures');
const font = pathToFileURL(
  path.join(root, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'),
).href;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = (raw) => {
  if (raw.startsWith('$ ')) return `<div><span class="p">$</span> ${esc(raw.slice(2))}</div>`;
  if (raw.startsWith('# ')) return `<div class="c">${esc(raw)}</div>`;
  const html = esc(raw)
    .replace(/^(CRITICAL)/, '<span class="crit">$1</span>')
    .replace(/^(WARNING)/, '<span class="warn">$1</span>')
    .replace(/^(INFO)/, '<span class="info">$1</span>')
    .replace(/(\[\w+\])/, '<span class="c">$1</span>');
  return `<div>${html || '&nbsp;'}</div>`;
};

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Geist Mono'; src: url('${font}') format('woff2'); font-weight: 100 900; }
  html, body { margin: 0; background: transparent; }
  .term { width: 720px; box-sizing: border-box; background: #111110; color: #e7e5e4; border-radius: 10px;
    border: 1px solid #2a2a28; overflow: hidden; font: 12.5px/1.6 'Geist Mono', ui-monospace, monospace; }
  .bar { display: flex; align-items: center; gap: 7px; padding: 10px 14px; border-bottom: 1px solid #2a2a28; }
  .bar i { width: 11px; height: 11px; border-radius: 50%; background: #3a3a37; }
  .bar span { margin-left: 8px; color: #8a8a85; font-size: 11.5px; }
  pre { margin: 0; padding: 14px 16px 16px; white-space: pre-wrap; tab-size: 4; font: inherit; }
  .p { color: #fb923c; } .c { color: #8a8a85; }
  .crit { color: #f87171; } .warn { color: #fbbf24; } .info { color: #7dd3fc; }
</style></head><body><div class="term"><div class="bar"><i></i><i></i><i></i><span>${esc(title)}</span></div>
<pre>${body}</pre></div></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 760, height: 600 } });
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.txt'))) {
  const name = file.replace(/\.txt$/, '');
  const text = (await readFile(path.join(dir, file), 'utf8')).trimEnd();
  const html = path.join(dir, `.${name}.html`);
  await writeFile(html, page(name, text.split('\n').map(line).join('')));
  await tab.goto(pathToFileURL(html).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.locator('.term').screenshot({ path: path.join(root, `src/assets/work/${name}.png`), omitBackground: true });
  await rm(html);
  console.log(`src/assets/work/${name}.png`);
}
await browser.close();
