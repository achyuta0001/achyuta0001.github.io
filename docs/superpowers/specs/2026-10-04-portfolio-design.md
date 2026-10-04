# Personal portfolio — design

Date: 2026-10-04
Status: approved; revised after independent review (2026-10-04)

## Goal

A single-page personal portfolio for Achyuta K Upadya, modeled on the structure and feel of
https://www.akshatsingh.site/ (minimal, type-led, numbered work list, tabbed stack, ⌘K palette,
live-clock footer), positioned as a **full-stack engineer in Bengaluru**.

Audience: recruiters and engineers. Success: in under a minute a visitor knows who he is, sees his
best work, his stack, and how to reach him. Page loads fast; all content is readable without
JavaScript — JS only enhances (palette, tabs, clock, theme toggle, reveal motion).

## Decisions

| Topic | Decision |
|---|---|
| Positioning | "Full-stack & platform engineer" (matches resume header "Full-Stack & Platform") |
| Location | Bengaluru (resume is current; GitHub README's "Pune" is stale) |
| Hosting | GitHub Pages, root user site `https://achyuta0001.github.io` |
| Repo | New public repo `achyuta0001/achyuta0001.github.io`, local `~/Developer/achyuta0001.github.io` |
| Stack | Astro (static output) + one React island (command palette) |
| Content sources | `~/Developer/job-search/resume_master.md`, `~/Developer/achyuta0001/readme.md`, public GitHub repos |
| Source conflicts | **resume_master wins** for any skill/role/number claim. Project pitches come from the GitHub README table / repo descriptions. |

## Page sections (in order)

Section ids are fixed: `#work`, `#experience`, `#stack`, `#about`, `#contact`.

1. **Hero** (`<h1>` = name) — "Full-stack & platform engineer in Bengaluru." Tagline (from README):
   "I work on the unglamorous half of shipping — getting services from a laptop to production and
   keeping them there." Plus a palette trigger `<button>` (see Interactions for label).
2. **Selected work** (`#work`) — numbered 01–06. Each row: title, pitch, tags, year, links. The
   title is the row's primary link (repo); secondary links are separate, no nested click-anywhere
   card.

   | # | Title | Pitch | Tags | Year | Links |
   |---|---|---|---|---|---|
   | 01 | Goo | A voice assistant for the Mac that lives in the notch. Ask about anything on your screen; Goo answers out loud and points at it. | Swift, macOS | 2026 | repo `github.com/achyuta0001/Goo`; releases `github.com/achyuta0001/goo-releases/releases` |
   | 02 | ashlar | Embeddable append-only commit log — segmented files, CRC-checked records, O(1) offset reads, crash recovery that truncates only an incomplete tail. Standard library only. | Go | 2026 | repo |
   | 03 | tripwyre | Project intelligence CLI — scans dependencies, config drift and logs into one prioritised report. Offline by default; ships as a GitHub Action. | Go, CLI | 2026 | repo |
   | 04 | hive | Source-agnostic knowledge compiler — ingests Markdown, Notion and Confluence, clusters by embeddings, synthesises merged wiki pages, serves them to AI agents over MCP. | Python, MCP | 2026 | repo |
   | 05 | blister | Native iOS 1:64 die-cast collection tracker — SwiftUI + SwiftData, on-device Vision OCR, RealityKit 3D studio. No backend, no third-party dependencies. | Swift, iOS | 2026 | repo |
   | 06 | obsidian-mcp | MCP server giving AI agents a per-project notes folder inside one Obsidian vault — six tools, git-based project inference, non-clobbering writes. | TypeScript, MCP | 2026 | repo |

3. **Experience** (`#experience`) — HSBC Software Development, Bengaluru, Jul 2024 – present.
   - Software Engineer, Unified Case Management (Jan 2025 – present):
     - Sole DevOps engineer for a 40+ microservice compliance team — pipelines, Kubernetes
       deployments, secret management, ingress.
     - Built a Spring Boot proxy for JWT authentication and request routing to an external
       cloud-native system — designed, built and shipped in ~4 weeks.
     - Led three platform-wide migrations: CloudBees → open-source Jenkins (40+ services), Helm and
       Kubernetes onboarding (42 services), NGINX → NGINX Plus (42 services).
   - Software Engineer, goAML Compliance Platform (Jul 2024 – Jan 2025):
     - Designed and built the Disclosure Service in Spring Boot from scratch, replacing a 2018-era
       UK legacy system.
     - Sole owner of PostgreSQL schema management on GCP Cloud SQL — every change shipped as a
       Liquibase migration.
4. **Stack** (`#stack`) — tabs (resume_master only):
   - Languages: Java, Go, Python, TypeScript / JavaScript, Swift
   - Backend: Spring Boot, FastAPI, Apache Kafka, JWT / OAuth2
   - Frontend: React, SwiftUI / SwiftData
   - Infra: Kubernetes, Helm, Docker, Jenkins, NGINX Plus, HashiCorp Vault, GCP
   - Data: PostgreSQL, GCP Cloud SQL, Liquibase, Amazon S3
5. **About** (`#about`) — copy, pinned: "Outside work I build small, dependency-light tools in Go,
   Python and Swift — usually to understand a system by rebuilding the part of it I don't
   understand yet. I also shoot product photography." Last sentence links (absolute URL) to
   `https://achyuta0001.github.io/photography-portfolio/`.
6. **Contact** (`#contact`) — "Let's work together": email (achyuta0001@gmail.com), GitHub,
   LinkedIn (`https://linkedin.com/in/achyuta-k-upadya`), resume PDF (`/resume.pdf`).
7. **Footer** — `Bengaluru · <time>HH:MM</time> IST`, theme toggle button, `© <year> Achyuta K Upadya`.

### Excluded on purpose

- Phone number on the page. Resume PDF: see "Open items".
- Private repos (Goo-Pro), old coursework repos, Kafka-Fraud-Detection (re-addable in `site.ts`).
- Instagram.
- Skills present only in the README (Angular, Next.js, Tailwind, Terraform, NestJS…), per the
  resume-wins rule.

## Visual design

- Narrow single column (~680px max), generous whitespace, hairline section dividers.
- Colour tokens in `global.css` for light and dark. Body and muted text meet WCAG AA 4.5:1 on their
  background; accent, focus rings and UI borders meet 3:1. Checked in both themes.
- Type: Geist (body) and Geist Mono (numbers, tags, clock), self-hosted via `@fontsource-variable/*`
  packages (verify names at install), latin subset only, `font-display: swap`.
- Responsive floor 360px; no horizontal scroll.

## Theme

- Three states: system (default), light, dark. Stored in `localStorage` key `theme`; absent = system.
- `<script is:inline>` in `<head>` reads it and sets `data-theme` on `<html>` before first paint,
  and adds class `js` to `<html>`. `<meta name="color-scheme" content="light dark">` and CSS
  `color-scheme` set. `theme-color` meta for both schemes.
- Toggle: visible button in the footer cycles system → light → dark, with an accessible label naming
  the current state; the same action exists in the palette.

## Motion

- Sections reveal (fade + 8px rise) when they enter the viewport: IntersectionObserver adds
  `.in`. The hidden initial state applies **only under `html.js`**, so no-JS, print and screenshot
  tooling see content. A section targeted by a hash jump is revealed immediately.
- Work rows: hover/focus lift + arrow nudge. Stack tab indicator slides.
- All of it off under `prefers-reduced-motion: reduce`.

## Interactions

### Command palette (React island, `cmdk`)

- Requires `@astrojs/react`, `react`, `react-dom`, `cmdk`. Hydrated `client:idle`.
- Pre-hydration: a tiny inline script listens for ⌘K / Ctrl+K and trigger-button clicks and sets
  `window.__paletteWanted = true`; the island opens itself on mount if the flag is set, then owns
  both triggers via a `palette:open` custom event. No dropped keystrokes.
- Trigger button label is server-rendered as "⌘K"; an inline script swaps to "Ctrl K" on non-Apple
  platforms and to "Menu" on touch-only (`(pointer: coarse)`) devices. The button opens the palette
  on tap, so mobile users get it too. (Inline script, not React, so no hydration mismatch.)
- Uses `Command.Dialog` (Radix): focus trap, `aria-modal`, Esc closes, focus returns to the trigger.
  `label="Command palette"`, `loop`, visible "Esc to close" hint.
- Commands:
  - Navigate: Work, Experience, Stack, About, Contact → `scrollIntoView` (smooth unless reduced
    motion) + update hash + close.
  - Links: GitHub, LinkedIn, Resume, Photography, and each of the six projects (open in new tab).
  - Copy email: `navigator.clipboard.writeText`; success shows "Copied" announced through a polite
    `aria-live` region; failure shows "Couldn't copy — achyuta0001@gmail.com" with the address
    selectable.
  - Toggle theme (same cycle as the footer button).

### Stack tabs (Astro component + small vanilla script — no React)

- Server markup: each group is a `<section>` with a real `<h3>` and its list. Without JS all groups
  show stacked and read as a list.
- With `html.js`: the script builds a `role="tablist"` from the headings (headings become visually
  hidden, panels get `role="tabpanel"`, `aria-labelledby`), sets `aria-selected`, `aria-controls`,
  roving `tabindex`, Arrow / Home / End keys, visible focus ring. Panels container reserves the
  tallest panel's height to avoid layout jump on switch.

### Clock

- Bundled Astro `<script>` (module, deferred — fine). Formats with `Intl.DateTimeFormat('en-GB',
  { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })`; the "IST"
  label is a literal string. Ticks on minute boundaries (`setTimeout(60000 - Date.now() % 60000)`).
  Server-rendered fallback: `Bengaluru · IST` without a time. Also sets the footer year at runtime
  (build-time year as fallback).

## Page chrome

- `<html lang="en">`, skip link to `<main>`, single `<h1>`, landmarks `<header>`, `<main>`,
  `<footer>`.
- Meta: title "Achyuta K Upadya — Full-stack & platform engineer", description (tagline), canonical
  `https://achyuta0001.github.io/`, Open Graph + `twitter:card=summary_large_image`, `og:image`
  `/og.png` 1200×630 (hand-made static PNG: name + role on theme background, generated once with a
  script and committed).
- `favicon.svg` with an internal `prefers-color-scheme` rule + `apple-touch-icon.png` 180px.
- `src/pages/404.astro`: minimal page linking home. Becomes the user-domain 404; project pages
  (e.g. `/photography-portfolio/`) are unaffected.
- `robots.txt` allowing all. No sitemap (single page). No JSON-LD.
- Nothing under `public/photography-portfolio`; the root site must not shadow that project page.

## Architecture

```
src/
  data/site.ts          # all content: profile, links, projects (incl. year), experience, stack groups
  layouts/Base.astro    # <head>: meta/OG, fonts, inline theme + palette-queue scripts
  components/           # Hero, Work, Experience, Stack, About, Contact, Footer (.astro)
  islands/              # CommandPalette.tsx
  scripts/              # reveal.ts, tabs.ts, clock.ts, theme.ts
  styles/global.css     # tokens (light/dark), base, motion
  pages/index.astro     # composes sections
  pages/404.astro
public/
  resume.pdf, favicon.svg, apple-touch-icon.png, og.png, robots.txt
tests/
  smoke.spec.ts         # Playwright
.github/workflows/deploy.yml
```

`site.ts` exports typed objects; components import only what they render. Content edits never touch
markup.

## Deploy

- `astro.config.mjs`: `site: 'https://achyuta0001.github.io'`, no `base`, `integrations: [react()]`.
- Node 22 pinned (`.nvmrc` + workflow), `package-lock.json` committed.
- Workflow `.github/workflows/deploy.yml`, triggers: push to `main`, `workflow_dispatch`.
  Permissions `contents: read`, `pages: write`, `id-token: write`;
  `concurrency: { group: pages, cancel-in-progress: false }`.
  - `test` job: setup-node 22, `npm ci`, `npx astro check`, `npm run build`,
    `npx playwright install --with-deps chromium` (cached), `npx playwright test`.
  - `build` job (`needs: test`): `withastro/action` with `node-version: 22`.
  - `deploy` job (`needs: build`): `actions/deploy-pages`, `environment: github-pages`.
- Order: create repo → set Pages source to "GitHub Actions" → push.

## Testing and verification

- Playwright config uses `webServer` to run `astro preview` on a fixed port,
  `reuseExistingServer: !process.env.CI`. Smoke test:
  - all five section headings + `<h1>` render;
  - `Control+K` opens the palette, "Copy email" command present, Esc closes and focus returns;
  - trigger-button click opens the palette;
  - clicking a stack tab shows its panel and hides others; arrow keys move selection;
  - clock shows a time for a frozen instant (`page.clock`);
  - no console errors and no failed requests.
- Manual rendered verification: screenshots in light, dark and 360px mobile before calling done.
- Work committed in several focused commits, not one dump.

## Owner decisions (2026-10-04)

1. `/resume.pdf` is a phone-free copy generated from `resume_master.md` (phone removed), styled
   with `~/Developer/job-search/resume.css`. The original PDF is not shipped.
2. GitHub profile README (`achyuta0001/achyuta0001`) gets "Pune" → "Bengaluru" in a separate
   one-line commit.

## Out of scope

Blog, CMS, analytics, contact form, multiple pages, i18n, sitemap, JSON-LD.
