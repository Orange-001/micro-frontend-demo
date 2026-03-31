#!/usr/bin/env bash
set -euo pipefail

BASE="/micro-frontend-demo"

echo "==> Building host..."
VITE_APP_BASE="${BASE}/" \
VITE_VUE_ENTRY="${BASE}/vue-child/" \
VITE_REACT_ENTRY="${BASE}/react-child/" \
  pnpm --filter @mfe/host build

echo "==> Building vue-child..."
VITE_APP_BASE="${BASE}/vue-child/" \
  pnpm --filter @mfe/vue-child build

echo "==> Building react-child..."
VITE_APP_BASE="${BASE}/react-child/" \
  pnpm --filter @mfe/react-child build

echo "==> Merging into dist/..."
rm -rf dist
mkdir -p dist

cp -r apps/host/dist/* dist/
cp -r apps/vue-child/dist dist/vue-child
cp -r apps/react-child/dist dist/react-child

# SPA fallback for GitHub Pages
cp dist/index.html dist/404.html

# Disable Jekyll processing
touch dist/.nojekyll

echo "==> Done! dist/ is ready for deployment."
