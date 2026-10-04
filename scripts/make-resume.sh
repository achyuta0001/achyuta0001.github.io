#!/usr/bin/env bash
# Regenerates public/resume.pdf from job-search/resume_master.md without the phone number.
set -euo pipefail
SRC="$HOME/Developer/job-search"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/resume.pdf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
sed -E 's/ ?\+91 ?[0-9 ]{10,12} ?·//' "$SRC/resume_master.md" > "$TMP/resume.md"
if grep -q '[redacted]' "$TMP/resume.md"; then echo "phone still present" >&2; exit 1; fi
cp "$SRC/resume.css" "$TMP/resume.css"
(cd "$TMP" && npx --yes md-to-pdf resume.md --stylesheet resume.css \
  --pdf-options '{"format":"A4","margin":{"top":"12mm","bottom":"12mm","left":"10mm","right":"10mm"}}')
cp "$TMP/resume.pdf" "$OUT"
echo "wrote $OUT"
