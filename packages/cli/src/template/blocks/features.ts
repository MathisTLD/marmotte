import { base } from "../base.js";
import { json } from "./shared.js";
import { blockPackageJson } from "./package-json.js";

// The features of `marmotte create` / `marmotte setup`: optional blocks of every preset

export const blockLint = base.createBlock({
  about: { name: "Lint", description: "oxlint" },
  produce() {
    return {
      addons: [
        blockPackageJson({
          scripts: { lint: "oxlint", "lint:fix": "oxlint --fix" },
          devDependencies: { oxlint: "^1.51.0" },
        }),
      ],
    };
  },
});

export const blockFormat = base.createBlock({
  about: { name: "Format", description: "oxfmt" },
  produce() {
    return {
      addons: [
        blockPackageJson({
          scripts: { fmt: "oxfmt", "fmt:check": "oxfmt --check" },
          devDependencies: { oxfmt: "^0.37.0" },
        }),
      ],
    };
  },
});

export const blockPreCommit = base.createBlock({
  about: { name: "Pre-commit", description: "husky + lint-staged" },
  produce() {
    return {
      files: { ".husky": { "pre-commit": ["npx lint-staged\n", { executable: true }] } },
      addons: [
        blockPackageJson({
          scripts: { prepare: "husky" },
          devDependencies: { husky: "^9.0.0", "lint-staged": "^16.0.0" },
          properties: { "lint-staged": { "*": "oxfmt --no-error-on-unmatched-pattern" } },
        }),
      ],
    };
  },
});

export const blockChangesets = base.createBlock({
  about: { name: "Changesets", description: "versioning + changelog" },
  produce() {
    return {
      files: {
        ".changeset": {
          "config.json": json({
            $schema: "https://unpkg.com/@changesets/config/schema.json",
            changelog: "@changesets/cli/changelog",
            commit: false,
            fixed: [],
            linked: [],
            access: "restricted",
            baseBranch: "main",
            updateInternalDependencies: "patch",
            ignore: [],
          }),
          "README.md": `# Changesets\n\nSee [changesets docs](https://github.com/changesets/changesets).\n`,
        },
      },
      addons: [
        blockPackageJson({
          scripts: {
            changeset: "changeset",
            version: "changeset version",
            release: "npm run build && changeset publish",
          },
          devDependencies: { "@changesets/cli": "^2.0.0" },
        }),
      ],
    };
  },
});

export const blockVersionLifecycle = base.createBlock({
  about: {
    name: "Version lifecycle",
    description: "preversion test + postversion build",
  },
  produce() {
    return {
      addons: [
        blockPackageJson({ scripts: { preversion: "vitest run", postversion: "npm run build" } }),
      ],
    };
  },
});

export const featureBlocks = [
  blockLint,
  blockFormat,
  blockPreCommit,
  blockChangesets,
  blockVersionLifecycle,
];
