#!/bin/sh
# One command to ship: check the build, commit everything, push. GitHub Actions then deploys to Pages.
# Usage: npm run deploy -- "pesan commit"   (message is optional)
set -e
cd "$(dirname "$0")/.."
echo "→ build check"
npm run build --silent
git add -A
if git diff --cached --quiet; then
  echo "Tidak ada perubahan untuk di-commit."
else
  git commit -m "${1:-update $(date '+%Y-%m-%d %H:%M')}"
fi
git push origin HEAD
echo "✓ Terkirim. Deploy otomatis berjalan: https://github.com/Ahmdmk10/Portofolio/actions"
