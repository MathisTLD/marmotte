---
title: Visibility
---

# Visibility

**Status: planned.** Nothing on this page is built yet; today every page is public.

Two audiences, without duplicating pages:

- **public**: people using the packages;
- **internal**: contributors and agents working in the repository. Agents read both on disk.

## Rule

- Any `dev/` folder under a docs root is **internal**: `docs/dev/`, `packages/<pkg>/docs/dev/`, … The globs are configurable (`internal: ["**/dev/**"]` by default) to mark more.
- `workspaceDocs({ audience: "public" | "internal" })` builds one or the other. The public build leaves internal pages out (`srcExclude`).
- Internal pages may link to public ones, and should rather than repeat them.
- A public page linking to an internal one gets a **build warning** in the public build, and the link is rendered as plain text, so the URL of a missing page is never published.
- `AGENTS.md` stays a short pointer into the docs.

Each repository decides which build it deploys: marmotte is open source and can deploy the internal one; a private monorepo deploys the public one.

## Not done

- Leaving the docs of `"private": true` packages out of the public build: no use case yet. Anything internal goes in `dev/`.
- Checking that public pages don't include (`<<<`, embeds) code from internal places: revisit with [code references](./code-references.md).
