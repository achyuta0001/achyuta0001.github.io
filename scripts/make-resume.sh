#!/usr/bin/env bash
# Regenerates public/resume.pdf from job-search/resume_master.md without the phone number.
set -euo pipefail
SRC="$HOME/Developer/job-search"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/resume.pdf"
# md-to-pdf's bundled Chrome is often not downloaded; fall back to the installed one.
SYS_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ] && [ -x "$SYS_CHROME" ]; then export PUPPETEER_EXECUTABLE_PATH="$SYS_CHROME"; fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
sed -E 's/ ?\+91 ?[0-9 ]{10,12} ?·//' "$SRC/resume_master.md" > "$TMP/resume.md"
if grep -q -E '\+91|[0-9]{10}|[0-9]{5} [0-9]{5}' "$TMP/resume.md"; then echo "phone still present" >&2; exit 1; fi
cp "$SRC/resume.css" "$TMP/resume.css"
(cd "$TMP" && npx --yes md-to-pdf resume.md --stylesheet resume.css \
  --pdf-options '{"format":"A4","margin":{"top":"12mm","bottom":"12mm","left":"10mm","right":"10mm"}}')
cp "$TMP/resume.pdf" "$OUT"
echo "wrote $OUT"
