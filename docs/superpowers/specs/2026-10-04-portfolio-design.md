# Personal portfolio — design

Date: 2026-10-04
Status: approved in conversation, pending written-spec review

## Goal

A single-page personal portfolio for Achyuta K Upadya, modeled on the structure and feel of
https://www.akshatsingh.site/ (minimal, type-led, numbered work list, tabbed stack, ⌘K palette,
live-clock footer), positioned as a **full-stack engineer in Bengaluru**.

Audience: recruiters and engineers. Success: in under a minute a visitor knows who he is, sees his
best work, his stack, and how to reach him. Page loads fast and works without JavaScript except for
the palette, tabs and clock.

## Decisions

| Topic | Decision |
|---|---|
| Positioning | Full-stack developer |
| Location | Bengaluru (hero + footer clock in IST) |
| Hosting | GitHub Pages, root user site `https://achyuta0001.github.io` |
| Repo | New public repo `achyuta0001/achyuta0001.github.io`, local `~/Developer/achyuta0001.github.io` |
| Stack | Astro (static output) + React islands for interactive parts |
| Content source | `~/Developer/job-search/resume_master.md`, `~/Developer/achyuta0001/readme.md`, public GitHub repos |

## Page sections (in order)

1. **Hero** — name, "Full-stack engineer in Bengaluru", one-line tagline adapted from the GitHub
   README ("the unglamorous half of shipping — getting services from a laptop to production and
   keeping them there"), and a "⌘K" hint (shows "Ctrl K" on non-Mac).
2. **Selected work** — numbered 01–06 list. Each entry: title, one-line pitch, tags (language +
   1–2 key tech), year, link(s).
   1. Goo — Mac voice assistant that lives in the notch (Swift). Links: repo, releases.
   2. ashlar — append-only commit log (Go).
   3. tripwyre — project intelligence CLI (Go).
   4. hive — knowledge compiler served over MCP (Python).
   5. blister — iOS die-cast collection tracker (Swift).
   6. obsidian-mcp — MCP server for per-project Obsidian notes (TypeScript).
3. **Experience** — HSBC Software Development, Bengaluru, Jul 2024 – present.
   - Software Engineer, Unified Case Management (Jan 2025 – present): 3 bullets — sole DevOps for
     40+ microservices; Spring Boot JWT proxy shipped in ~4 weeks; Jenkins / Helm / NGINX Plus
     migrations across 40+ services.
   - Software Engineer, goAML Compliance Platform (Jul 2024 – Jan 2025): 2 bullets — Disclosure
     Service built from scratch replacing 2018 legacy; PostgreSQL/Liquibase schema ownership on GCP.
4. **Stack** — tabs:
   - Backend: Java, Spring Boot, Kafka, Go, FastAPI, Node.js
   - Frontend: React, Angular, TypeScript, Next.js, SwiftUI, Tailwind
   - Infra: Kubernetes, Helm, Jenkins, HashiCorp Vault, GCP, Docker, NGINX Plus
   - Data: PostgreSQL, GCP Cloud SQL, Liquibase, Amazon S3
5. **About** — short paragraph: builds small, dependency-light tools in Go, Python and Swift to
   understand systems by rebuilding them; also shoots product photography (link to
   https://achyuta0001.github.io/photography-portfolio/).
6. **Contact** — "Let's work together": email (achyuta0001@gmail.com), GitHub, LinkedIn
   (linkedin.com/in/achyuta-k-upadya), resume PDF.
7. **Footer** — "Bengaluru · HH:MM IST" live clock, © year.

### Excluded on purpose

- Phone number (public page invites scraping).
- Private repos (Goo-Pro) and old coursework repos.
- Kafka-Fraud-Detection (keeps work list at six; trivially re-addable via data file).

## Visual design

- Narrow single column (~680px max), generous whitespace, hairline section dividers.
- Theme: follows `prefers-color-scheme`; manual toggle (via palette) persisted in `localStorage`,
  applied by an inline head script to avoid flash. One muted accent for links and focus rings.
- Type: Geist (body) and Geist Mono (numbers, tags, clock), self-hosted via `@fontsource`.
- Motion: sections fade/rise on enter (IntersectionObserver + CSS classes); work rows hover-lift
  with arrow nudge; stack tab underline slides. All motion off under `prefers-reduced-motion`.
- Responsive down to 360px; no horizontal scroll.

## Interactions

- **Command palette** (React island, `cmdk`): opens on ⌘K / Ctrl+K and on clicking the hero hint;
  Esc closes. Commands: jump to each section; open GitHub, LinkedIn, resume, photography site, each
  project; copy email (with "Copied" feedback); toggle theme.
- **Stack tabs** (React island): ARIA tablist, arrow-key navigation. Without JS, all groups render
  stacked (progressive enhancement via server-rendered content).
- **Clock**: inline script, `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`, updates each
  minute. Static fallback text without JS.

## Architecture

```
src/
  data/site.ts          # all content: profile, links, projects, experience, stack groups
  layouts/Base.astro    # <head>, fonts, theme init script, meta + Open Graph
  components/           # Hero, Work, Experience, Stack, About, Contact, Footer (.astro)
  islands/              # CommandPalette.tsx, StackTabs.tsx
  styles/global.css     # tokens (light/dark), base, motion
  pages/index.astro     # composes sections
public/
  resume.pdf            # copied from ~/Developer/job-search/Achyuta_Upadya_Resume.pdf
  favicon.svg, og.png
tests/
  smoke.spec.ts         # Playwright
.github/workflows/deploy.yml
```

- `site.ts` exports typed objects; each component imports only what it renders. Content edits never
  touch markup.
- Islands hydrate with `client:idle` (palette) and `client:visible` (tabs).

## Deploy

- GitHub Actions workflow using `withastro/action` + `actions/deploy-pages` on push to `main`.
- Repo Pages source set to "GitHub Actions".
- `astro.config.mjs`: `site: 'https://achyuta0001.github.io'`, no `base`.

## Testing and verification

- `astro check` (types) and `astro build` in CI before deploy.
- Playwright smoke test against `astro preview`: page renders all section headings; ⌘K opens
  palette and "Copy email" command exists; stack tab switch changes visible panel; no console errors.
- Manual rendered verification: screenshots in light, dark and 375px mobile before calling done.
- Work committed in several focused commits, not one dump.

## Out of scope

Blog, CMS, analytics, contact form, multiple pages, i18n.
