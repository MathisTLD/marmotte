#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
(
  cd "$ROOT"

  echo "==> Cleaning..."
  rm -rf node_modules dist docs/.vitepress/dist docs/.vitepress/cache docs/reference/api

  echo "==> Installing dependencies..."
  npm ci

  echo "==> Building library..."
  npm run build

  echo "==> Running tests..."
  npm run test -- --run

  echo "==> Building docs..."
  npm run build:docs

  echo "==> Done."
)