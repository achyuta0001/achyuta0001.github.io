import { chromium } from '@playwright/test';

const og = `<!doctype html><html><head><style>
  body{margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;
  padding:0 96px;box-sizing:border-box;background:#0c0c0c;color:#ededed;font-family:-apple-system,Helvetica,Arial,sans-serif}
  h1{font-size:72px;margin:0;letter-spacing:-1px} p{font-size:34px;margin:20px 0 0;color:#a1a1aa}
  .u{margin-top:56px;font:28px ui-monospace,Menlo,monospace;color:#fb923c}
</style></head><body><h1>Achyuta K Upadya</h1><p>Full-stack &amp; platform engineer · Bengaluru</p>
<div class="u">achyuta0001.github.io</div></body></html>`;

const icon = `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#171717;
display:flex;align-items:center;justify-content:center">
<svg width="120" height="120" viewBox="0 0 32 32"><path d="M9 23 L16 9 L23 23 M11.5 18 H20.5" fill="none"
stroke="#fafaf9" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og);
await page.screenshot({ path: 'public/og.png' });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(icon);
await page.screenshot({ path: 'public/apple-touch-icon.png' });
await browser.close();
