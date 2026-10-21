#!/bin/bash

set -euo pipefail

TESTS_DIR="$(dirname "$(realpath "$0")")"
ROOT="$(cd "$TESTS_DIR/../../.." && pwd)"
SCAFFOLD_DIR="${TMPDIR:-/tmp}/marmotte-test-projects"
mkdir -p "$SCAFFOLD_DIR"

gen_packages() {
  # pack every publishable workspace package: scaffolded projects depend on unpublished @mrmt/*
  # packages (the private root and @mrmt/utils, inlined into the others, are left out)
  (
    cd "$ROOT";
    "$ROOT/node_modules/.bin/vp" pm pack --filter '!marmotte-monorepo' --filter '!@mrmt/utils' --pack-destination "$SCAFFOLD_DIR" >/dev/null
  )
}

find_packages() {
  ls "$SCAFFOLD_DIR"/*.tgz
}

test_template() {
  local template_name=$1
  local dest="$SCAFFOLD_DIR/$template_name"
  echo "scaffolding template '$template_name' in '$dest'"

  # Getting weird typescript errors when installing from dir paths
  # using proper archive packages better simulates the real end usage
  echo "- packaging marmotte..."
  rm -f "$SCAFFOLD_DIR"/*.tgz
  gen_packages

  echo "- cleaning up..."
  rm -rf "$dest"
  echo "- scaffolding..."
  node "$ROOT/packages/cli/dist/cli/index.js" create --template "$template_name" --name "$template_name" "$dest"
  (
    cd "$dest";
    echo "- installing..."
    npm install $(find_packages)
    echo "- building..."
    npm run build
    if [ $# -gt 1 ]; then
      shift
      echo "- running command '$*'"
      (
        cd "$dest";
        "$@"
      )
    fi
    echo "- ✅ done"
  )
}

# ./test.sh ./node-library npx vitepress dev ./docs
test_template "$@"