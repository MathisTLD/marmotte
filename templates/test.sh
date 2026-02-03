#!/bin/bash

set -euo pipefail

DIR="$(dirname "$(realpath "$0")")"
ROOT="$(dirname "$DIR")"
SCAFFOLD_DIR="$ROOT/.template-tests"

test_template() {
  local template_path=$1
  mkdir -p $SCAFFOLD_DIR
  local template_name="$(basename "$template_path")"
  local dest="$SCAFFOLD_DIR/$template_name"
  echo "scaffolding template '$template_name' in '$dest'"
  echo "- cleaning up..."
  rm -rf $dest
  echo "- copying..."
  cp -r $template_path $dest
  (
    cd "$dest";
    echo "- installing..."
    npm install $ROOT
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