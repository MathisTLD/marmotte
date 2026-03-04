#!/bin/bash

set -euo pipefail

TESTS_DIR="$(dirname "$(realpath "$0")")"
ROOT="$(dirname "$TESTS_DIR")"
SCAFFOLD_DIR="$TESTS_DIR/.projects"
mkdir -p "$SCAFFOLD_DIR"

gen_package() {
  (
    cd "$ROOT";
    npm pack --pack-destination "$SCAFFOLD_DIR"
  )
}

package_version() {
  node -e "process.stdout.write(require('$ROOT/package.json').version)"
}

find_package() {
  # TODO: proper resolution
  echo "$SCAFFOLD_DIR/marmotte-$(package_version).tgz"
}

test_template() {
  local template_name=$1
  local dest="$SCAFFOLD_DIR/$template_name"
  echo "scaffolding template '$template_name' in '$dest'"

  # Getting weird typescript errors when installing marmotte from dir path
  # using a proper archive package better simulates the real end usage
  local package_path="$(find_package)"
  echo "- packaging marmotte..."
  gen_package

  echo "- cleaning up..."
  rm -rf "$dest"
  echo "- scaffolding..."
  npx marmotte create --template "$template_name" --name "$template_name" "$dest"
  (
    cd "$dest";
    echo "- installing..."
    npm install "$package_path"
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