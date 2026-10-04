# Personal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single-page Astro portfolio for Achyuta K Upadya at `https://achyuta0001.github.io`, modeled on akshatsingh.site.

**Architecture:** Astro static output. All content lives in one typed module (`src/data/site.ts`); `.astro` section components render it to zero-JS HTML. Enhancements are small vanilla modules (`src/scripts/*.ts`: theme, tabs, reveal, clock) plus one React island (command palette, `cmdk` inside a native `<dialog>`). Playwright tests run against `astro preview`; GitHub Actions gates deploy on them.

**Tech Stack:** Astro 7.3, @astrojs/react 7, React 19, cmdk 1.1, @fontsource-variable/geist + geist-mono 5.3, TypeScript 5 (for `astro check`), @playwright/test 1.63, Node 22 (CI) / ≥22.12 locally.

**Spec:** `docs/superpowers/specs/2026-10-04-portfolio-design.md`

## Global Constraints

- Repo root: `~/Developer/achyuta0001.github.io` (already `git init`ed, branch `main`, spec committed).
- `astro.config.mjs`: `site: 'https://achyuta0001.github.io'`, no `base`.
- resume_master wins on any skill/role/number claim. Copy in `site.ts` is pinned by the spec — do not paraphrase.
- The owner's phone number must not appear anywhere in `dist/` (HTML or PDF).
- Content readable without JS. Hidden-until-revealed state applies only under `html.js`.
- All motion disabled under `prefers-reduced-motion: reduce`.
- Text contrast ≥ 4.5:1, focus rings / UI borders ≥ 3:1, both themes.
- Section ids fixed: `work`, `experience`, `stack`, `about`, `contact`.
- localStorage key for theme: `theme`; values `light` | `dark`; absent = system.
- Never create `public/photography-portfolio`.
- Every commit message ends with:
  `Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH`
- Several focused commits — one per task minimum.

## Review Focus

1. Pressing ⌘K / Ctrl+K before the palette island hydrates → palette opens once hydrated, not silently dropped. (Task 7 test: queue flag.)
2. Visitor with JS disabled → every section, all five stack groups and all text visible. (Task 4 and Task 5 no-JS tests.)
3. Clipboard write rejected (permission denied) → palette shows "Couldn't copy — achyuta0001@gmail.com", not a silent failure. (Task 7 test with clipboard stubbed to reject.)
4. Returning visitor who chose dark/light → theme applied before first paint, no flash. (Task 3 test checks `data-theme` at `domcontentloaded`.)
5. Deep link `/#contact` on first load → target section is visible immediately, not stuck at opacity 0. (Task 6 test.)

---

### Task 1: Scaffold Astro + React + Playwright

**Files:**
- Create (via scaffold): `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `.gitignore`, `public/`, `AGENTS.md`, `CLAUDE.md`, `.vscode/`
- Create: `.nvmrc`, `playwright.config.ts`, `tests/fixtures.ts`, `tests/smoke.spec.ts`
- Delete: `README.md` from scaffold (replaced in Task 9), `public/favicon.*` from scaffold (replaced in Task 8)

**Interfaces:**
- Produces: `npm run build`, `npm run preview`, `npm run check`, `npm run test:e2e`; `tests/fixtures.ts` exporting `test` (with auto fixture failing on console errors, page errors, failed requests, HTTP ≥400) and `expect`.

- [ ] **Step 1: Scaffold into a temp dir and move in** (create-astro refuses a non-empty dir)

```bash
cd ~/Developer/achyuta0001.github.io
TMP=$(mktemp -d)
npm create astro@latest "$TMP/app" -- --template minimal --no-install --no-git --skip-houston --yes
rm -f "$TMP/app/README.md" "$TMP/app/public/"favicon.*
cp -R "$TMP/app/." .
rm -rf "$TMP"
echo 22 > .nvmrc
```

Edit `package.json`: set `"name": "achyuta0001.github.io"`, `"private": true`, and scripts:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "test:e2e": "astro build && playwright test",
  "astro": "astro"
}
```

- [ ] **Step 2: Install deps and add React**

```bash
npm install
npx astro add react --yes
npm install cmdk@^1.1.1 @fontsource-variable/geist@^5.3.0 @fontsource-variable/geist-mono@^5.3.0
npm install -D @astrojs/check@^0.9.10 typescript@^5 @playwright/test@^1.63.0
npx playwright install chromium
```

Then set `astro.config.mjs` to exactly:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://achyuta0001.github.io',
  integrations: [react()],
});
```

Confirm `tsconfig.json` has `"jsx": "react-jsx"` and `"jsxImportSource": "react"` under `compilerOptions` (added by `astro add react`); add them if missing.

- [ ] **Step 3: Playwright config and fixture**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

`tests/fixtures.ts`:

```ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
      await use(errors);
      expect(errors, 'page produced errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
```

- [ ] **Step 4: Write the failing smoke test**

`tests/smoke.spec.ts`:

```ts
import { test, expect } from './fixtures';

test('home renders the name as the only h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Achyuta K Upadya');
});
```

- [ ] **Step 5: Run to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL — h1 text is the template's "Astro".

- [ ] **Step 6: Minimal page**

Replace `src/pages/index.astro`:

```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>Achyuta K Upadya</title></head>
  <body><h1>Achyuta K Upadya</h1></body>
</html>
```

- [ ] **Step 7: Run tests and type check**

Run: `npm run test:e2e && npm run check`
Expected: 1 passed; `astro check` 0 errors. (A missing `/favicon.ico` 404 would fail the fixture — if it does, add `<link rel="icon" href="data:," />` to the head for now; Task 8 replaces it.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Scaffold Astro 7 with React island support and Playwright

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 2: Content module

**Files:**
- Create: `src/data/site.ts`
- Test: `tests/content.spec.ts` (written in Task 4 — this task is verified by `astro check`)

**Interfaces:**
- Produces (exact exports, used by Tasks 4, 5, 7):

```ts
export type Link = { label: string; href: string };
export type Project = { title: string; pitch: string; tags: string[]; year: number; href: string; extra: Link[] };
export type Role = { title: string; team: string; period: string; stack: string; bullets: string[] };
export type StackGroup = { name: string; items: string[] };
export type Section = { id: 'work' | 'experience' | 'stack' | 'about' | 'contact'; label: string };
export const profile: { name; role; location; tagline; email; about; photography: Link };
export const links: { github: Link; linkedin: Link; resume: Link; photography: Link };
export const sections: Section[];
export const projects: Project[];
export const employer: { name: string; location: string; period: string; roles: Role[] };
export const stack: StackGroup[];
export const meta: { title: string; description: string; url: string };
```

- [ ] **Step 1: Write `src/data/site.ts`**

```ts
export type Link = { label: string; href: string };
export type Project = {
  title: string;
  pitch: string;
  tags: string[];
  year: number;
  href: string;
  extra: Link[];
};
export type Role = { title: string; team: string; period: string; stack: string; bullets: string[] };
export type StackGroup = { name: string; items: string[] };
export type Section = {
  id: 'work' | 'experience' | 'stack' | 'about' | 'contact';
  label: string;
};

const GH = 'https://github.com/achyuta0001';

export const links = {
  github: { label: 'GitHub', href: GH },
  linkedin: { label: 'LinkedIn', href: 'https://linkedin.com/in/achyuta-k-upadya' },
  resume: { label: 'Resume', href: '/resume.pdf' },
  photography: { label: 'Photography', href: 'https://achyuta0001.github.io/photography-portfolio/' },
} satisfies Record<string, Link>;

export const profile = {
  name: 'Achyuta K Upadya',
  role: 'Full-stack & platform engineer',
  location: 'Bengaluru',
  tagline:
    'I work on the unglamorous half of shipping — getting services from a laptop to production and keeping them there.',
  email: 'achyuta0001@gmail.com',
  about:
    'Outside work I build small, dependency-light tools in Go, Python and Swift — usually to understand a system by rebuilding the part of it I don’t understand yet.',
  photography: { label: 'I also shoot product photography.', href: links.photography.href },
};

export const meta = {
  title: 'Achyuta K Upadya — Full-stack & platform engineer',
  description: profile.tagline,
  url: 'https://achyuta0001.github.io/',
};

export const sections: Section[] = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack', label: 'Stack' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export const projects: Project[] = [
  {
    title: 'Goo',
    pitch:
      'A voice assistant for the Mac that lives in the notch. Ask about anything on your screen; Goo answers out loud and points at it.',
    tags: ['Swift', 'macOS'],
    year: 2026,
    href: `${GH}/Goo`,
    extra: [{ label: 'Releases', href: `${GH}/goo-releases/releases` }],
  },
  {
    title: 'ashlar',
    pitch:
      'Embeddable append-only commit log — segmented files, CRC-checked records, O(1) offset reads, crash recovery that truncates only an incomplete tail. Standard library only.',
    tags: ['Go'],
    year: 2026,
    href: `${GH}/ashlar`,
    extra: [],
  },
  {
    title: 'tripwyre',
    pitch:
      'Project intelligence CLI — scans dependencies, config drift and logs into one prioritised report. Offline by default; ships as a GitHub Action.',
    tags: ['Go', 'CLI'],
    year: 2026,
    href: `${GH}/tripwyre`,
    extra: [],
  },
  {
    title: 'hive',
    pitch:
      'Source-agnostic knowledge compiler — ingests Markdown, Notion and Confluence, clusters by embeddings, synthesises merged wiki pages, serves them to AI agents over MCP.',
    tags: ['Python', 'MCP'],
    year: 2026,
    href: `${GH}/hive`,
    extra: [],
  },
  {
    title: 'blister',
    pitch:
      'Native iOS 1:64 die-cast collection tracker — SwiftUI + SwiftData, on-device Vision OCR, RealityKit 3D studio. No backend, no third-party dependencies.',
    tags: ['Swift', 'iOS'],
    year: 2026,
    href: `${GH}/blister`,
    extra: [],
  },
  {
    title: 'obsidian-mcp',
    pitch:
      'MCP server giving AI agents a per-project notes folder inside one Obsidian vault — six tools, git-based project inference, non-clobbering writes.',
    tags: ['TypeScript', 'MCP'],
    year: 2026,
    href: `${GH}/obsidian-mcp`,
    extra: [],
  },
];

export const employer = {
  name: 'HSBC Software Development',
  location: 'Bengaluru',
  period: 'Jul 2024 – present',
  roles: [
    {
      title: 'Software Engineer',
      team: 'Unified Case Management',
      period: 'Jan 2025 – present',
      stack: 'Java · Spring Boot · Kubernetes · Helm · Jenkins · NGINX Plus · HashiCorp Vault',
      bullets: [
        'Sole DevOps engineer for a 40+ microservice compliance team — pipelines, Kubernetes deployments, secret management, ingress.',
        'Built a Spring Boot proxy for JWT authentication and request routing to an external cloud-native system — designed, built and shipped in ~4 weeks.',
        'Led three platform-wide migrations: CloudBees → open-source Jenkins (40+ services), Helm and Kubernetes onboarding (42 services), NGINX → NGINX Plus (42 services).',
      ],
    },
    {
      title: 'Software Engineer',
      team: 'goAML Compliance Platform',
      period: 'Jul 2024 – Jan 2025',
      stack: 'Java · Spring Boot · React · GCP Cloud SQL · Liquibase',
      bullets: [
        'Designed and built the Disclosure Service in Spring Boot from scratch, replacing a 2018-era UK legacy system.',
        'Sole owner of PostgreSQL schema management on GCP Cloud SQL — every change shipped as a Liquibase migration.',
      ],
    },
  ] satisfies Role[],
};

export const stack: StackGroup[] = [
  { name: 'Languages', items: ['Java', 'Go', 'Python', 'TypeScript / JavaScript', 'Swift'] },
  { name: 'Backend', items: ['Spring Boot', 'FastAPI', 'Apache Kafka', 'JWT / OAuth2'] },
  { name: 'Frontend', items: ['React', 'SwiftUI / SwiftData'] },
  { name: 'Infra', items: ['Kubernetes', 'Helm', 'Docker', 'Jenkins', 'NGINX Plus', 'HashiCorp Vault', 'GCP'] },
  { name: 'Data', items: ['PostgreSQL', 'GCP Cloud SQL', 'Liquibase', 'Amazon S3'] },
];
```

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/site.ts
git commit -m "Add typed content module pinned to the spec

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 3: Base layout, tokens, fonts, theme

**Files:**
- Create: `src/layouts/Base.astro`, `src/styles/global.css`, `src/scripts/theme.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/theme.spec.ts`

**Interfaces:**
- Consumes: `meta` from `site.ts`.
- Produces:
  - `Base.astro` props `{ title?: string; description?: string }`; renders `<html lang="en">`, head, skip link `<a class="skip" href="#main">`, `<slot />`. Inline head script adds class `js` to `<html>` and applies stored theme; also installs the palette pre-hydration queue (`window.__paletteWanted`, `window.__paletteReady`, `palette:open` event) used by Task 7.
  - `src/scripts/theme.ts`: `type ThemePref = 'system' | 'light' | 'dark'`; `getTheme(): ThemePref`; `setTheme(t: ThemePref): void`; `cycleTheme(): ThemePref`; `initThemeButton(btn: HTMLButtonElement): void`. `setTheme` dispatches `theme:change` on `document`.
  - CSS utilities: `.visually-hidden`, `.section`, `.mono`, tokens `--bg --fg --muted --line --accent --focus`.

- [ ] **Step 1: Write the failing tests** — `tests/theme.spec.ts`

```ts
import { test, expect } from './fixtures';

test('defaults to system: no data-theme attribute, js class set', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme');
  await expect(html).toHaveClass(/\bjs\b/);
});

test('stored theme applies before first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
});

test('footer toggle cycles system → light → dark → system and persists', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByRole('button', { name: /Theme: system/ });
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Theme: light/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /Theme: dark/ }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('head has color-scheme, theme-color for both schemes, canonical and OG', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://achyuta0001.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://achyuta0001.github.io/og.png');
  await expect(page).toHaveTitle('Achyuta K Upadya — Full-stack & platform engineer');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/theme.spec.ts`
Expected: FAIL (no js class, no toggle button, no meta).

- [ ] **Step 3: `src/scripts/theme.ts`**

```ts
export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'theme';
const ORDER: ThemePref[] = ['system', 'light', 'dark'];

export function getTheme(): ThemePref {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(t: ThemePref): void {
  const root = document.documentElement;
  try {
    if (t === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // storage blocked: still apply for this page view
  }
  if (t === 'system') delete root.dataset.theme;
  else root.dataset.theme = t;
  document.dispatchEvent(new CustomEvent<ThemePref>('theme:change', { detail: t }));
}

export function cycleTheme(): ThemePref {
  const next = ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length];
  setTheme(next);
  return next;
}

export function initThemeButton(btn: HTMLButtonElement): void {
  const render = () => {
    const t = getTheme();
    btn.textContent = `Theme: ${t}`;
    btn.setAttribute('aria-label', `Theme: ${t}. Activate to change.`);
  };
  render();
  btn.hidden = false;
  btn.addEventListener('click', () => cycleTheme());
  document.addEventListener('theme:change', render);
}
```

- [ ] **Step 4: `src/styles/global.css`**

```css
:root {
  --bg: #fafaf9;
  --fg: #171717;
  --muted: #57534e;
  --line: #e7e5e4;
  --accent: #c2410c;
  --focus: #c2410c;
  --surface: #ffffff;
  --shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.08);
  --sans: 'Geist Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --mono: 'Geist Mono Variable', ui-monospace, 'SF Mono', Menlo, monospace;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #0c0c0c;
    --fg: #ededed;
    --muted: #a1a1aa;
    --line: #262626;
    --accent: #fb923c;
    --focus: #fb923c;
    --surface: #161616;
    --shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.5);
  }
}
:root[data-theme='dark'] {
  --bg: #0c0c0c;
  --fg: #ededed;
  --muted: #a1a1aa;
  --line: #262626;
  --accent: #fb923c;
  --focus: #fb923c;
  --surface: #161616;
  --shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.5);
  color-scheme: dark;
}
:root[data-theme='light'] { color-scheme: light; }

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 2rem; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 400 16px/1.6 var(--sans);
  -webkit-font-smoothing: antialiased;
}
main, .site-footer, .site-header { max-width: 680px; margin-inline: auto; padding-inline: 20px; }
a { color: inherit; text-decoration-color: var(--line); text-underline-offset: 3px; }
a:hover { color: var(--accent); text-decoration-color: currentColor; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; border-radius: 4px; }
h1, h2, h3 { line-height: 1.2; font-weight: 600; letter-spacing: -0.01em; }
h2 { font-size: 0.8125rem; font-family: var(--mono); font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 1.5rem; }
.mono { font-family: var(--mono); }
.muted { color: var(--muted); }
.section { padding-block: 3.5rem; border-top: 1px solid var(--line); outline: none; }
.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.skip { position: absolute; left: 12px; top: -48px; padding: 8px 12px; background: var(--fg); color: var(--bg); border-radius: 6px; z-index: 10; }
.skip:focus { top: 12px; }
button { font: inherit; color: inherit; }
```

- [ ] **Step 5: `src/layouts/Base.astro`**

```astro
---
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../styles/global.css';
import { meta } from '../data/site';

interface Props { title?: string; description?: string }
const { title = meta.title, description = meta.description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const og = new URL('/og.png', Astro.site).href;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#fafaf9" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0c0c0c" media="(prefers-color-scheme: dark)" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={og} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <script is:inline>
      (function () {
        var d = document.documentElement;
        d.classList.add('js');
        try {
          var t = localStorage.getItem('theme');
          if (t === 'light' || t === 'dark') d.dataset.theme = t;
        } catch (e) {}
        window.__paletteWanted = false;
        function want(detail) {
          if (window.__paletteReady) document.dispatchEvent(new CustomEvent('palette:open', { detail: detail }));
          else window.__paletteWanted = true;
        }
        document.addEventListener('keydown', function (e) {
          if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); want(null); }
        });
        document.addEventListener('click', function (e) {
          var t = e.target && e.target.closest && e.target.closest('[data-palette-trigger]');
          if (t) want(null);
        });
      })();
    </script>
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <slot />
  </body>
</html>
```

Note: the real `public/favicon.svg` is created in this task (content in Task 8 Step 3 — copy it now) so the fixture sees no 404. **Omit the `<link rel="apple-touch-icon">` line until Task 8**, which creates the PNG and adds the line back. `og.png` is only referenced in meta, never fetched by the page, so it can't 404 here.

- [ ] **Step 6: Wire `index.astro` with a footer toggle**

```astro
---
import Base from '../layouts/Base.astro';
import { profile } from '../data/site';
---
<Base>
  <main id="main">
    <h1>{profile.name}</h1>
  </main>
  <footer class="site-footer">
    <button type="button" class="theme-toggle" data-theme-toggle hidden>Theme</button>
  </footer>
</Base>
<script>
  import { initThemeButton } from '../scripts/theme';
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (btn) initThemeButton(btn);
</script>
```

(The button is `hidden` without JS because it can't work without JS; `initThemeButton` un-hides it.)

- [ ] **Step 7: Run tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass, 0 errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add base layout, colour tokens, self-hosted fonts and flash-free theme toggle

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 4: Static sections (Hero, Work, Experience, About, Contact, Footer)

**Files:**
- Create: `src/components/Hero.astro`, `Work.astro`, `Experience.astro`, `About.astro`, `Contact.astro`, `Footer.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/content.spec.ts`

**Interfaces:**
- Consumes: `profile`, `projects`, `employer`, `links`, `sections` from `site.ts`; `initThemeButton` from `theme.ts`.
- Produces: DOM contract used by later tasks —
  - each top-level section is `<section id="{id}" class="section" data-reveal tabindex="-1" aria-labelledby="{id}-h">` with `<h2 id="{id}-h">`;
  - hero palette trigger: `<button type="button" data-palette-trigger aria-label="Open command palette"><kbd data-kbd>⌘K</kbd></button>`;
  - footer: `<time data-clock>` with fallback text `IST`, `<span data-year>` with build year, `<button data-theme-toggle hidden>`.

- [ ] **Step 1: Write failing tests** — `tests/content.spec.ts`

```ts
import { test, expect } from './fixtures';

test('all sections render with headings in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['work', 'experience', 'stack', 'about', 'contact']);
  for (const name of ['Selected work', 'Experience', 'Stack', 'About', 'Let’s work together']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
});

test('hero shows role, location and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Full-stack & platform engineer in Bengaluru.')).toBeVisible();
  await expect(page.getByText(/unglamorous half of shipping/)).toBeVisible();
});

test('work list has six numbered projects with Goo first and releases link', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#work li.work-row');
  await expect(rows).toHaveCount(6);
  await expect(rows.first().locator('.num')).toHaveText('01');
  await expect(rows.first().getByRole('link', { name: 'Goo' })).toHaveAttribute('href', 'https://github.com/achyuta0001/Goo');
  await expect(rows.first().getByRole('link', { name: /Releases/ })).toHaveAttribute('href', 'https://github.com/achyuta0001/goo-releases/releases');
  await expect(rows.nth(5).locator('.num')).toHaveText('06');
});

test('experience shows both HSBC roles', async ({ page }) => {
  await page.goto('/');
  const exp = page.locator('#experience');
  await expect(exp.getByText('Unified Case Management')).toBeVisible();
  await expect(exp.getByText('goAML Compliance Platform')).toBeVisible();
  await expect(exp.getByText(/three platform-wide migrations/)).toBeVisible();
});

test('contact links and photography link are correct', async ({ page }) => {
  await page.goto('/');
  const c = page.locator('#contact');
  await expect(c.getByRole('link', { name: 'achyuta0001@gmail.com' })).toHaveAttribute('href', 'mailto:achyuta0001@gmail.com');
  await expect(c.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/achyuta0001');
  await expect(c.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/in/achyuta-k-upadya');
  await expect(c.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/resume.pdf');
  await expect(page.locator('#about a')).toHaveAttribute('href', 'https://achyuta0001.github.io/photography-portfolio/');
});

test('phone number never appears', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).not.toMatch(/\+91|\b\d{10}\b|\b\d{5}\s\d{5}\b/);
});

test('landmarks and skip link exist', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main#main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every section is visible', async ({ page }) => {
    await page.goto('/');
    for (const id of ['work', 'experience', 'stack', 'about', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id}`)).toBeVisible();
      expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
  });
});
```

The Stack section is created in Task 5; for this task add a placeholder `<section id="stack" class="section" data-reveal tabindex="-1" aria-labelledby="stack-h"><h2 id="stack-h">Stack</h2></section>` directly in `index.astro`, replaced in Task 5.

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/content.spec.ts`
Expected: FAIL (sections missing).

- [ ] **Step 3: Components**

`src/components/Hero.astro`:

```astro
---
import { profile } from '../data/site';
---
<header class="site-header hero">
  <h1>{profile.name}</h1>
  <p class="hero-role">{profile.role} in {profile.location}.</p>
  <p class="hero-tagline muted">{profile.tagline}</p>
  <button type="button" class="palette-trigger mono" data-palette-trigger aria-label="Open command palette">
    <kbd data-kbd>⌘K</kbd>
  </button>
</header>
<script is:inline>
  (function () {
    var k = document.querySelector('[data-palette-trigger] [data-kbd]');
    if (!k) return;
    var touch = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
    var apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    k.textContent = touch ? 'Menu' : apple ? '⌘K' : 'Ctrl K';
  })();
</script>
<style>
  .hero { padding-block: 6rem 3.5rem; }
  .hero h1 { font-size: 1.125rem; margin: 0; }
  .hero-role { font-size: 1.125rem; margin: 0.25rem 0 1.25rem; }
  .hero-tagline { margin: 0 0 2rem; max-width: 52ch; }
  .palette-trigger {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.6rem;
    border: 1px solid var(--line); border-radius: 6px; background: transparent; cursor: pointer;
    font-size: 0.8125rem; color: var(--muted);
  }
  .palette-trigger:hover { color: var(--fg); border-color: var(--muted); }
  kbd { font: inherit; }
</style>
```

Note: in the hero the `<h1>` lives inside `<header>`, outside `<main>`. The skip link targets `#main`, so it skips the hero — intended.

`src/components/Work.astro`:

```astro
---
import { projects } from '../data/site';
const pad = (n: number) => String(n).padStart(2, '0');
---
<section id="work" class="section" data-reveal tabindex="-1" aria-labelledby="work-h">
  <h2 id="work-h">Selected work</h2>
  <ol class="work-list">
    {projects.map((p, i) => (
      <li class="work-row">
        <span class="num mono muted">{pad(i + 1)}</span>
        <div class="work-body">
          <div class="work-head">
            <a class="work-title" href={p.href} target="_blank" rel="noopener">
              {p.title}<span class="arrow" aria-hidden="true">↗</span>
            </a>
            <span class="mono muted year">{p.year}</span>
          </div>
          <p class="pitch muted">{p.pitch}</p>
          <ul class="tags mono" aria-label="Tags">
            {p.tags.map((t) => <li>{t}</li>)}
          </ul>
          {p.extra.length > 0 && (
            <p class="extra">
              {p.extra.map((l) => (
                <a href={l.href} target="_blank" rel="noopener">{l.label} ↗</a>
              ))}
            </p>
          )}
        </div>
      </li>
    ))}
  </ol>
</section>
<style>
  .work-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
  .work-row {
    display: grid; grid-template-columns: 2.25rem 1fr; gap: 0.5rem; padding: 1rem 0.75rem;
    margin-inline: -0.75rem; border-radius: 10px;
    transition: background-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  }
  .work-row:hover, .work-row:focus-within { background: var(--surface); box-shadow: var(--shadow); transform: translateY(-2px); }
  .num { font-size: 0.8125rem; padding-top: 0.2rem; }
  .work-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
  .work-title { font-weight: 600; text-decoration: none; }
  .arrow { display: inline-block; margin-left: 0.3rem; color: var(--muted); transition: transform 200ms ease; }
  .work-row:hover .arrow, .work-title:focus-visible .arrow { transform: translate(2px, -2px); color: var(--accent); }
  .year { font-size: 0.8125rem; }
  .pitch { margin: 0.25rem 0 0.5rem; font-size: 0.9375rem; }
  .tags { list-style: none; display: flex; flex-wrap: wrap; gap: 0.375rem; padding: 0; margin: 0; font-size: 0.75rem; }
  .tags li { border: 1px solid var(--line); border-radius: 999px; padding: 0.05rem 0.5rem; color: var(--muted); }
  .extra { margin: 0.5rem 0 0; font-size: 0.875rem; }
</style>
```

`src/components/Experience.astro`:

```astro
---
import { employer } from '../data/site';
---
<section id="experience" class="section" data-reveal tabindex="-1" aria-labelledby="experience-h">
  <h2 id="experience-h">Experience</h2>
  <div class="employer">
    <h3>{employer.name}</h3>
    <p class="mono muted meta">{employer.location} · {employer.period}</p>
  </div>
  {employer.roles.map((r) => (
    <article class="role">
      <h4>{r.title} <span class="muted">— {r.team}</span></h4>
      <p class="mono muted meta">{r.period}</p>
      <p class="mono muted stackline">{r.stack}</p>
      <ul>{r.bullets.map((b) => <li>{b}</li>)}</ul>
    </article>
  ))}
</section>
<style>
  .employer h3 { margin: 0; font-size: 1rem; }
  .meta { font-size: 0.8125rem; margin: 0.15rem 0 0; }
  .role { margin-top: 1.75rem; }
  .role h4 { margin: 0; font-size: 0.9375rem; font-weight: 600; }
  .stackline { font-size: 0.75rem; margin: 0.35rem 0 0; }
  .role ul { margin: 0.75rem 0 0; padding-left: 1.1rem; display: grid; gap: 0.4rem; font-size: 0.9375rem; }
</style>
```

`src/components/About.astro`:

```astro
---
import { profile } from '../data/site';
---
<section id="about" class="section" data-reveal tabindex="-1" aria-labelledby="about-h">
  <h2 id="about-h">About</h2>
  <p>{profile.about} <a href={profile.photography.href}>{profile.photography.label}</a></p>
</section>
```

`src/components/Contact.astro`:

```astro
---
import { profile, links } from '../data/site';
const items = [links.github, links.linkedin, links.resume];
---
<section id="contact" class="section" data-reveal tabindex="-1" aria-labelledby="contact-h">
  <h2 id="contact-h">Let’s work together</h2>
  <p class="lead">Open to full-stack and platform roles. The fastest way to reach me is email.</p>
  <p><a class="email" href={`mailto:${profile.email}`}>{profile.email}</a></p>
  <ul class="contact-links mono">
    {items.map((l) => (
      <li><a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel={l.href.startsWith('http') ? 'noopener' : undefined}>{l.label}</a></li>
    ))}
  </ul>
</section>
<style>
  .lead { margin-top: 0; }
  .email { font-size: 1.25rem; font-weight: 500; }
  .contact-links { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.875rem; }
</style>
```

> Spec note: "Open to full-stack and platform roles…" is new one-line CTA copy, consistent with the spec's "Let's work together" heading. If the owner objects, delete the `<p class="lead">`.

`src/components/Footer.astro`:

```astro
---
import { profile } from '../data/site';
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <p class="mono muted">{profile.location} · <time data-clock>IST</time></p>
  <button type="button" class="theme-toggle mono" data-theme-toggle hidden>Theme</button>
  <p class="mono muted">© <span data-year>{year}</span> {profile.name}</p>
</footer>
<script>
  import { initThemeButton } from '../scripts/theme';
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (btn) initThemeButton(btn);
</script>
<style>
  .site-footer {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem;
    padding-block: 2rem 3rem; border-top: 1px solid var(--line); font-size: 0.8125rem;
  }
  .site-footer p { margin: 0; }
  .theme-toggle { background: none; border: 1px solid var(--line); border-radius: 6px; padding: 0.25rem 0.6rem; cursor: pointer; color: var(--muted); font-size: 0.75rem; }
  .theme-toggle:hover { color: var(--fg); border-color: var(--muted); }
</style>
```

- [ ] **Step 4: Compose `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Work from '../components/Work.astro';
import Experience from '../components/Experience.astro';
import About from '../components/About.astro';
import Contact from '../components/Contact.astro';
import Footer from '../components/Footer.astro';
---
<Base>
  <Hero />
  <main id="main" tabindex="-1">
    <Work />
    <Experience />
    <section id="stack" class="section" data-reveal tabindex="-1" aria-labelledby="stack-h"><h2 id="stack-h">Stack</h2></section>
    <About />
    <Contact />
  </main>
  <Footer />
</Base>
```

(Remove the old inline footer/script from Task 3 — `Footer.astro` now owns the toggle.)

- [ ] **Step 5: Run all tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add hero, work, experience, about, contact and footer sections

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 5: Stack tabs

**Files:**
- Create: `src/components/Stack.astro`, `src/scripts/tabs.ts`
- Modify: `src/pages/index.astro` (replace placeholder stack section)
- Test: `tests/tabs.spec.ts`

**Interfaces:**
- Consumes: `stack` from `site.ts`.
- Produces: `initTabs(root: HTMLElement): void` in `src/scripts/tabs.ts`.

- [ ] **Step 1: Failing tests** — `tests/tabs.spec.ts`

```ts
import { test, expect } from './fixtures';

test('tabs: first selected, click switches, arrows/home/end move', async ({ page }) => {
  await page.goto('/#stack');
  const list = page.getByRole('tablist', { name: 'Stack groups' });
  const tabs = list.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  const stack = page.locator('#stack');
  await expect(page.getByRole('tabpanel', { name: 'Languages' })).toBeVisible();
  await expect(stack.getByText('Kubernetes', { exact: true })).toBeHidden();

  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(stack.getByText('Kubernetes', { exact: true })).toBeVisible();
  await expect(stack.getByText('Spring Boot', { exact: true })).toBeHidden();

  await tabs.nth(3).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(4)).toBeFocused();
  await expect(tabs.nth(4)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(4)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
});

test('tab switch does not change section height', async ({ page }) => {
  await page.goto('/#stack');
  const sec = page.locator('#stack');
  const h0 = (await sec.boundingBox())!.height;
  await page.getByRole('tab', { name: 'Frontend' }).click();
  const h1 = (await sec.boundingBox())!.height;
  expect(Math.abs(h1 - h0)).toBeLessThan(1);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all groups render stacked with headings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const name of ['Languages', 'Backend', 'Frontend', 'Infra', 'Data']) {
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    await expect(page.locator('#stack').getByText('Kubernetes', { exact: true })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/tabs.spec.ts`
Expected: FAIL (no tablist).

- [ ] **Step 3: `src/scripts/tabs.ts`**

```ts
export function initTabs(root: HTMLElement): void {
  const panelsWrap = root.querySelector<HTMLElement>('[data-tab-panels]');
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tab-panel]'));
  if (!panelsWrap || panels.length === 0) return;

  const list = document.createElement('div');
  list.className = 'tablist';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Stack groups');
  const indicator = document.createElement('span');
  indicator.className = 'tab-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  const tabs = panels.map((panel) => {
    const heading = panel.querySelector('h3');
    const label = heading?.textContent?.trim() ?? panel.id;
    heading?.classList.add('visually-hidden');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${panel.id}-tab`;
    tab.className = 'tab mono';
    tab.textContent = label;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    list.append(tab);
    return tab;
  });
  list.append(indicator);
  root.insertBefore(list, panelsWrap);
  root.classList.add('tabs-ready');

  let current = 0;
  const place = () => {
    const t = tabs[current];
    indicator.style.width = `${t.offsetWidth}px`;
    indicator.style.transform = `translateX(${t.offsetLeft}px)`;
  };
  const select = (i: number, focus = false) => {
    current = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].classList.toggle('is-active', on);
    });
    place();
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  });
  window.addEventListener('resize', place);
  select(0);
}
```

- [ ] **Step 4: `src/components/Stack.astro`**

```astro
---
import { stack } from '../data/site';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
---
<section id="stack" class="section" data-reveal tabindex="-1" aria-labelledby="stack-h">
  <h2 id="stack-h">Stack</h2>
  <div class="tabs" data-tabs>
    <div class="panels" data-tab-panels>
      {stack.map((g) => (
        <div class="panel" id={`stack-${slug(g.name)}`} data-tab-panel>
          <h3>{g.name}</h3>
          <ul class="chips">{g.items.map((it) => <li>{it}</li>)}</ul>
        </div>
      ))}
    </div>
  </div>
</section>
<script>
  import { initTabs } from '../scripts/tabs';
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach(initTabs);
</script>
<style>
  .panel h3 { font-size: 0.875rem; margin: 1.25rem 0 0.5rem; }
  .panel:first-child h3 { margin-top: 0; }
  .chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chips li { border: 1px solid var(--line); border-radius: 8px; padding: 0.3rem 0.65rem; font-size: 0.875rem; }
  .tabs-ready .panels { display: grid; }
  .tabs-ready .panel { grid-area: 1 / 1; visibility: hidden; }
  .tabs-ready .panel.is-active { visibility: visible; }
  .tabs-ready .panel:focus-visible { outline-offset: 6px; }
</style>
<style is:global>
  .tablist { position: relative; display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--line); }
  .tab { background: none; border: 0; padding: 0.5rem 0.75rem; cursor: pointer; color: var(--muted); font-size: 0.8125rem; }
  .tab[aria-selected='true'] { color: var(--fg); }
  .tab-indicator { position: absolute; left: 0; bottom: -1px; height: 2px; background: var(--accent); transition: transform 250ms ease, width 250ms ease; }
</style>
```

(`.tablist`/`.tab` are global because they're created by script, so Astro's scoped-style hashing doesn't reach them.)

- [ ] **Step 5: Replace placeholder in `index.astro`** with `import Stack from '../components/Stack.astro';` and `<Stack />` in its place.

- [ ] **Step 6: Run all tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass (including Task 4's no-JS test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add accessible stack tabs that degrade to stacked groups without JS

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 6: Reveal motion and live clock

**Files:**
- Create: `src/scripts/reveal.ts`, `src/scripts/clock.ts`
- Modify: `src/styles/global.css` (append motion rules), `src/components/Footer.astro` (start clock), `src/pages/index.astro` (start reveal)
- Test: `tests/motion-clock.spec.ts`

**Interfaces:**
- Produces: `initReveal(): void`; `formatIST(d: Date): string` → `"HH:MM"`; `startClock(el: HTMLTimeElement, yearEl: HTMLElement | null): void`.

- [ ] **Step 1: Failing tests** — `tests/motion-clock.spec.ts`

```ts
import { test, expect } from './fixtures';

test('sections reveal when scrolled into view', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).not.toHaveClass(/\bin\b/);
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toHaveClass(/\bin\b/);
  await expect.poll(() => contact.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
});

test('deep link target is visible immediately', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.locator('#contact')).toHaveClass(/\bin\b/);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('unrevealed sections are still fully visible', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('#contact').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });
});

test('footer clock shows IST time for a frozen instant', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-04T08:30:00Z'));
  await page.goto('/');
  await expect(page.locator('time[data-clock]')).toHaveText('14:00 IST');
  await expect(page.locator('[data-year]')).toHaveText('2026');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/motion-clock.spec.ts`
Expected: FAIL (no `.in` class, clock shows "IST").

- [ ] **Step 3: `src/scripts/reveal.ts`**

```ts
export function initReveal(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const reveal = (el: Element) => el.classList.add('in');
  const revealHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = id ? document.getElementById(id) : null;
    if (t) reveal(t);
  };
  revealHash();
  window.addEventListener('hashchange', revealHash);
  if (!('IntersectionObserver' in window)) {
    els.forEach(reveal);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          reveal(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
```

- [ ] **Step 4: `src/scripts/clock.ts`**

```ts
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatIST(d: Date): string {
  return fmt.format(d);
}

export function startClock(el: HTMLTimeElement, yearEl: HTMLElement | null): void {
  const tick = () => {
    const now = new Date();
    el.textContent = `${formatIST(now)} IST`;
    el.dateTime = now.toISOString();
    if (yearEl) yearEl.textContent = String(now.getFullYear());
    setTimeout(tick, 60_000 - (Date.now() % 60_000));
  };
  tick();
}
```

- [ ] **Step 5: Append to `src/styles/global.css`**

```css
[data-reveal] { transition: opacity 500ms ease, transform 500ms ease; }
html.js [data-reveal]:not(.in) { opacity: 0; transform: translateY(8px); }
@media (prefers-reduced-motion: reduce) {
  html.js [data-reveal]:not(.in) { opacity: 1; transform: none; }
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
@media print {
  html.js [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 6: Wire scripts**

In `Footer.astro`'s `<script>` add:

```ts
import { startClock } from '../scripts/clock';
const clock = document.querySelector<HTMLTimeElement>('time[data-clock]');
if (clock) startClock(clock, document.querySelector<HTMLElement>('[data-year]'));
```

In `index.astro` append:

```astro
<script>
  import { initReveal } from '../scripts/reveal';
  initReveal();
</script>
```

- [ ] **Step 7: Run all tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass. If a Task 4/5 test that checks visibility of a below-fold section now fails because it's unrevealed, add `await page.locator('#id').scrollIntoViewIfNeeded()` before the assertion — do not weaken the reveal.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add scroll reveal (JS-gated, reduced-motion safe) and live IST clock

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 7: Command palette island

**Files:**
- Create: `src/islands/CommandPalette.tsx`, `src/styles/palette.css`
- Modify: `src/pages/index.astro`
- Test: `tests/palette.spec.ts`

**Interfaces:**
- Consumes: `cycleTheme` from `src/scripts/theme.ts`; `sections`, `links`, `projects`, `profile` from `site.ts`; the head script's `window.__paletteWanted` / `window.__paletteReady` / `palette:open` contract (Task 3).
- Produces: default export `CommandPalette(props: { email: string; sections: { id: string; label: string }[]; links: { label: string; href: string }[]; projects: { title: string; href: string }[] })`.

**Spec deviation (deliberate):** the spec names cmdk's `Command.Dialog` (Radix). cmdk's `Command.Dialog` does not forward Radix's `onCloseAutoFocus`, so focus return races Radix's own `setTimeout` restore. Use plain `<Command>` inside a native `<dialog>` opened with `showModal()`: browser-native modality (background inert), Esc via `cancel`, `aria-modal` implied, and we restore focus deterministically on `close`. Same requirements, fewer moving parts.

- [ ] **Step 1: Failing tests** — `tests/palette.spec.ts`

```ts
import { test, expect } from './fixtures';

const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Command palette' });

test('Control+K opens, Esc closes', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('combobox')).toBeFocused();
  await expect(page.getByRole('option', { name: 'Copy email' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
});

test('trigger click opens and focus returns to trigger on close', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  const trigger = page.getByRole('button', { name: 'Open command palette' });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('shortcut pressed before hydration is honoured', async ({ page }) => {
  await page.route('**/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
});

test('navigate command scrolls to section and updates hash', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.keyboard.type('Contact');
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
});

test('copy email announces success', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('achyuta0001@gmail.com');
});

test('copy email failure shows the address', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Couldn’t copy — achyuta0001@gmail.com');
});

test('toggle theme command cycles theme', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('trigger label is platform-appropriate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-kbd]')).toHaveText(/^(⌘K|Ctrl K|Menu)$/);
});
```

Add `tests/globals.d.ts`:

```ts
export {};
declare global {
  interface Window { __paletteWanted?: boolean; __paletteReady?: boolean }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/palette.spec.ts`
Expected: FAIL (`__paletteReady` never true).

- [ ] **Step 3: `src/islands/CommandPalette.tsx`**

```tsx
import { Command } from 'cmdk';
import { useEffect, useRef, useState } from 'react';
import { cycleTheme } from '../scripts/theme';
import '../styles/palette.css';

declare global {
  interface Window { __paletteWanted?: boolean; __paletteReady?: boolean }
}

type Item = { label: string; href: string };
type Props = {
  email: string;
  sections: { id: string; label: string }[];
  links: Item[];
  projects: { title: string; href: string }[];
};

export default function CommandPalette({ email, sections, links, projects }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const onOpen = () => {
      if (dialogRef.current?.open) return;
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setStatus('');
      setOpen(true);
    };
    document.addEventListener('palette:open', onOpen);
    window.__paletteReady = true;
    if (window.__paletteWanted) {
      window.__paletteWanted = false;
      onOpen();
    }
    return () => {
      document.removeEventListener('palette:open', onOpen);
      window.__paletteReady = false;
    };
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const onClose = () => {
    setOpen(false);
    const el = returnTo.current;
    returnTo.current = null;
    el?.focus();
  };

  const go = (id: string) => {
    const el = document.getElementById(id);
    returnTo.current = el;
    setOpen(false);
    if (!el) return;
    el.classList.add('in');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    history.replaceState(null, '', `#${id}`);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const openLink = (href: string) => {
    setOpen(false);
    window.open(href, href.startsWith('http') ? '_blank' : '_self', 'noopener');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setStatus('Copied');
    } catch {
      setStatus(`Couldn’t copy — ${email}`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label="Command palette"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {open && (
        <Command label="Command palette" loop>
          <Command.Input placeholder="Type a command or search…" autoFocus />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Group heading="Navigate">
              {sections.map((s) => (
                <Command.Item key={s.id} onSelect={() => go(s.id)}>{s.label}</Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Actions">
              <Command.Item onSelect={copyEmail}>Copy email</Command.Item>
              <Command.Item onSelect={() => setStatus(`Theme: ${cycleTheme()}`)}>Toggle theme</Command.Item>
            </Command.Group>
            <Command.Group heading="Links">
              {links.map((l) => (
                <Command.Item key={l.href} onSelect={() => openLink(l.href)}>{l.label}</Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Projects">
              {projects.map((p) => (
                <Command.Item key={p.href} value={`project ${p.title}`} onSelect={() => openLink(p.href)}>
                  {p.title}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      )}
      <div className="palette-foot mono">
        <span role="status" aria-live="polite">{status}</span>
        <span aria-hidden="true">Esc to close</span>
      </div>
    </dialog>
  );
}
```

Note on `go()`: `returnTo` is set to the section (which has `tabindex="-1"`) so `onClose` moves focus there instead of back to the trigger — keyboard users land where they navigated. `el.focus()` scrolls; the `scrollIntoView` after `replaceState` runs first since `close` fires after the state update renders. If the test shows focus scroll fighting smooth scroll, change `el?.focus()` in `onClose` to `el?.focus({ preventScroll: true })`.

- [ ] **Step 4: `src/styles/palette.css`**

```css
.palette {
  width: min(560px, calc(100vw - 32px));
  max-height: min(480px, calc(100vh - 96px));
  margin: 12vh auto auto;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--fg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.palette::backdrop { background: rgb(0 0 0 / 0.35); backdrop-filter: blur(2px); }
.palette [cmdk-root] { display: flex; flex-direction: column; max-height: inherit; }
.palette [cmdk-input] {
  width: 100%; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: var(--fg);
  padding: 14px 16px; font: inherit; font-size: 15px; outline: none;
}
.palette [cmdk-list] { overflow: auto; max-height: 340px; padding: 6px; }
.palette [cmdk-group-heading] { font: 500 11px/1 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding: 10px 10px 6px; }
.palette [cmdk-item] { padding: 9px 10px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.palette [cmdk-item][data-selected='true'] { background: var(--line); }
.palette [cmdk-empty] { padding: 16px; color: var(--muted); font-size: 14px; }
.palette-foot { display: flex; justify-content: space-between; gap: 12px; padding: 8px 14px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
.palette-foot [role='status'] { user-select: text; color: var(--fg); }
@media (prefers-reduced-motion: no-preference) {
  .palette[open] { animation: palette-in 160ms ease-out; }
  @keyframes palette-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } }
}
```

- [ ] **Step 5: Mount in `index.astro`** — add to frontmatter:

```ts
import CommandPalette from '../islands/CommandPalette';
import { profile, sections, links, projects } from '../data/site';
const paletteLinks = [links.github, links.linkedin, links.resume, links.photography];
const paletteProjects = projects.map((p) => ({ title: p.title, href: p.href }));
```

and after `<Footer />`:

```astro
<CommandPalette client:idle email={profile.email} sections={sections} links={paletteLinks} projects={paletteProjects} />
```

- [ ] **Step 6: Run all tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass. If `getByRole('combobox')` fails, check cmdk's input role in the rendered DOM (`page.locator('[cmdk-input]')`) and use that locator instead — don't drop the focus assertion.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add command palette island with pre-hydration shortcut queue

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 8: Static assets, 404, phone-free resume

**Files:**
- Create: `public/robots.txt` (`public/favicon.svg` already created in Task 3), `scripts/make-images.mjs` (→ `public/og.png`, `public/apple-touch-icon.png`), `scripts/make-resume.sh` (→ `public/resume.pdf`), `src/pages/404.astro`
- Modify: `src/layouts/Base.astro` (add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` after the favicon link)
- Test: `tests/assets.spec.ts`

**Interfaces:**
- Consumes: `Base.astro`.

- [ ] **Step 1: Failing tests** — `tests/assets.spec.ts`

```ts
import { test as base, expect } from '@playwright/test';
import { test } from './fixtures';

for (const path of ['/favicon.svg', '/apple-touch-icon.png', '/og.png', '/robots.txt', '/resume.pdf']) {
  test(`${path} is served`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  });
}

test('og.png is 1200x630', async ({ page }) => {
  await page.goto('/og.png');
  const size = await page.evaluate(() => {
    const img = document.querySelector('img')!;
    return [img.naturalWidth, img.naturalHeight];
  });
  expect(size).toEqual([1200, 630]);
});

base('unknown path serves 404 page linking home', async ({ page }) => {
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
});
```

Note: no byte-grep test on the PDF (streams are compressed, it can never fail). Step 6 verifies by reading the rendered PDF; the script guard checks the stripped markdown.

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- tests/assets.spec.ts`
Expected: FAIL (404s).

- [ ] **Step 3: `public/favicon.svg` and `public/robots.txt`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    rect { fill: #171717; } path { stroke: #fafaf9; }
    @media (prefers-color-scheme: dark) { rect { fill: #ededed; } path { stroke: #0c0c0c; } }
  </style>
  <rect width="32" height="32" rx="7"/>
  <path d="M9 23 L16 9 L23 23 M11.5 18 H20.5" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

```
User-agent: *
Allow: /
```

- [ ] **Step 4: `scripts/make-images.mjs`** (one-off generator; outputs committed)

```js
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
```

Run: `node scripts/make-images.mjs` and confirm Base.astro has the `apple-touch-icon` link.

- [ ] **Step 5: `scripts/make-resume.sh`** (phone-free resume from resume_master)

```bash
#!/usr/bin/env bash
# Regenerates public/resume.pdf from job-search/resume_master.md without the phone number.
set -euo pipefail
SRC="$HOME/Developer/job-search"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/resume.pdf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
sed -E 's/ ?\+91 ?[0-9 ]{10,12} ?·//' "$SRC/resume_master.md" > "$TMP/resume.md"
if grep -q -E '\+91|[0-9]{10}|[0-9]{5} [0-9]{5}' "$TMP/resume.md"; then echo "phone still present" >&2; exit 1; fi
cp "$SRC/resume.css" "$TMP/resume.css"
(cd "$TMP" && npx --yes md-to-pdf resume.md --stylesheet resume.css \
  --pdf-options '{"format":"A4","margin":{"top":"12mm","bottom":"12mm","left":"10mm","right":"10mm"}}')
cp "$TMP/resume.pdf" "$OUT"
echo "wrote $OUT"
```

Run: `chmod +x scripts/make-resume.sh && scripts/make-resume.sh`

- [ ] **Step 6: Verify the PDF by rendering it** — open `public/resume.pdf` with the Read tool and confirm: contact line reads `achyuta0001@gmail.com · linkedin… · github…` with no phone, no stray leading/trailing `·`, layout matches the original (1–2 pages).

- [ ] **Step 7: `src/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Not found — Achyuta K Upadya">
  <main id="main" class="nf">
    <h1>Page not found</h1>
    <p class="muted">Nothing lives at this address.</p>
    <p><a href="/">Back home</a></p>
  </main>
</Base>
<style>
  .nf { padding-block: 8rem; }
  .nf h1 { font-size: 1.125rem; }
</style>
```

- [ ] **Step 8: Run all tests**

Run: `npm run test:e2e && npm run check`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add favicon, touch icon, OG image, robots, 404 and phone-free resume

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 9: CI/deploy workflow and README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx astro check
      - run: npm run build
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v4
        with:
          node-version: 22

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Before committing, check the latest major tags: `gh api repos/withastro/action/releases/latest --jq .tag_name` and the same for `actions/deploy-pages`, `actions/checkout`, `actions/setup-node`, `actions/cache`, `actions/upload-artifact`; bump the `@vN` pins if newer majors exist.

- [ ] **Step 2: Lint the workflow**

Run: `npx --yes @action-validator/cli .github/workflows/deploy.yml` (or `actionlint` if installed)
Expected: no errors.

- [ ] **Step 3: `README.md`**

```markdown
# achyuta0001.github.io

Personal site. Astro + one React island (command palette), deployed to GitHub Pages.

- Content: edit `src/data/site.ts` only.
- Dev: `npm run dev`
- Test: `npm run test:e2e` (builds, then Playwright against `astro preview`)
- Types: `npm run check`
- Regenerate OG image + touch icon: `node scripts/make-images.mjs`
- Regenerate resume (phone stripped): `scripts/make-resume.sh`

Pushing to `main` runs tests, then deploys.
```

Also add `playwright-report/` and `test-results/` to `.gitignore`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add test-gated GitHub Pages deploy workflow and README

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
```

---

### Task 10: Rendered verification, publish, profile README

**Owner confirmation required before Steps 3–6** (they create/modify public GitHub state).

- [ ] **Step 1: Screenshots** — with `npm run preview` running, use Playwright (or claude-in-chrome) to capture full-page screenshots after scrolling to the bottom (so all sections reveal) at: 1280px light, 1280px dark (`colorScheme: 'dark'`), 360px light, plus one with the palette open. Look at each: alignment, contrast, no overflow at 360px, tabs indicator under the right tab, palette centred.

- [ ] **Step 2: Fix anything found**, re-run `npm run test:e2e`, commit fixes with a message naming what was wrong.

- [ ] **Step 3: Create repo and enable Pages (Actions source)**

```bash
gh repo create achyuta0001/achyuta0001.github.io --public --source . --remote origin --description "Personal site"
gh api -X POST repos/achyuta0001/achyuta0001.github.io/pages -f build_type=workflow
```

- [ ] **Step 4: Push and watch**

```bash
git push -u origin main
gh run watch --exit-status
```

Expected: test → build → deploy all green.

- [ ] **Step 5: Verify live** — load `https://achyuta0001.github.io/` and screenshot; confirm `https://achyuta0001.github.io/photography-portfolio/` still loads; `curl -sI https://achyuta0001.github.io/resume.pdf` → 200.

- [ ] **Step 6: Profile README location** — in `~/Developer/achyuta0001`:

```bash
sed -i '' 's/Pune, India/Bengaluru, India/' readme.md
git diff
git commit -am "Update location to Bengaluru

Claude-Session: https://claude.ai/code/session_01Et8CSD7jnrTATJCsS9wWaH"
git push
```

Also add a "Site" badge/link to `https://achyuta0001.github.io` in that README only if the owner asks.
