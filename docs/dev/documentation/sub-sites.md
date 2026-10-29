---
title: Sub-sites
---

# Sub-sites

**Status: planned.** Nothing on this page is built yet.

The case: a package needs its own deployed docs site (and later maybe a docs MCP), the root site should show it too, and other pages link to it. Links in both directions have to work in both builds.

## What a sub-site is

A docs folder that contains a `.vitepress/` folder. Its pages are **not** merged into the parent site: it is a separate VitePress app with its own theme, sidebar and search. Its config uses our helper (`subsiteDocs()`), which carries the site map and the link rule, and must not set `base`.

## The site map

Every page belongs to exactly one site: the root site, or the sub-site whose folder holds it. Each site declares where it is deployed (`url`). Because everything lives in one repository, the map is computed from the files: nothing is fetched.

Authors keep writing relative `.md` links ([Links](./index.md#links-relative-file-links-only)). The site being built (S) resolves each one:

| The target page belongs to…      | The link in S's build                                 |
| -------------------------------- | ----------------------------------------------------- |
| S                                | a normal internal link                                |
| another site T, mounted inside S | `/<T's mount>/…`, loaded as a full page (another app) |
| another site T, not mounted      | absolute `T.url/…`                                    |

So a sub-site built on its own links to the root pages at the root's deployed URL.

## Mounting in the root site

After its own build (VitePress `buildEnd`), the root site builds each sub-site in a child process:

```sh
vitepress build <sub-site> --base <root base><slug>/ --outDir <root outDir>/<slug>
```

and sets an environment variable that tells `subsiteDocs()` it is mounted, so its links to root pages become same-origin. The sub-site's config file is the same in both modes. Mounted pages carry `<link rel="canonical">` to the standalone URL, so search engines see one copy.

A sub-site deployed elsewhere and not mounted is only linked: the root nav points to its `url`.

## Later

- **Dev server:** serve mounted sub-sites from the root dev server (a second VitePress server behind a proxy). Until then, run the sub-site's own dev server.
- **Inventories:** each site publishes an `inventory.json` (pages, headings, symbols → URL), like Sphinx's [`objects.inv`](https://sphobjinv.readthedocs.io/en/v2.4/syntax.html). Only needed for links across repositories, and it is what a docs MCP would serve.
