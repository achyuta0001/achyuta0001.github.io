# achyuta0001.github.io

Personal site. Astro + one React island (command palette), deployed to GitHub Pages.

- Content: edit `src/data/site.ts` only.
- Dev: `npm run dev`
- Test: `npm run test:e2e` (builds, then Playwright against `astro preview`)
- Types: `npm run check`
- Regenerate OG image + touch icon: `node scripts/make-images.mjs`
- Regenerate resume (phone stripped): `scripts/make-resume.sh` (reads from `~/Developer/job-search`, so it only works on the owner's machine)

Pushing to `main` runs tests, then deploys.
