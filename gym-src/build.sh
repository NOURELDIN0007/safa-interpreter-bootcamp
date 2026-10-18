#!/usr/bin/env bash
# Rebuild Safsf Gym Plan and refresh the deployed copy in ../gym (served by GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")"
CDN=https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd
[ -d node_modules ] || npm ci --no-audit --no-fund
npx vitest run
VITE_DEMO=1 VITE_IMG_BASE=$CDN/images/ VITE_GIF_BASE=$CDN/videos/ npx vite build
rm -rf ../gym && cp -r dist ../gym
echo "Built → ../gym"
