---
title: Code references
---

# Code references

**Status: planned.** Nothing on this page is built yet.

Docs drift when they repeat the code. Four mechanisms, cheapest first, keep the code the single source:

| Need                             | Write                                                        | On disk               | On the site                                               |
| -------------------------------- | ------------------------------------------------------------ | --------------------- | --------------------------------------------------------- |
| short inline example             | ` ```ts twoslash `                                           | a normal code block   | type-checked at build, hover types                        |
| longer or runnable example       | `<<< ../src/foo.example.ts#region`                           | a path to a real file | the region inlined                                        |
| reference to a symbol            | `[Lib()](../src/lib.ts#Lib)`                                 | a plain link          | checked, then linked to the API anchor or the source line |
| a symbol's docs or options table | `[LibPluginOptions](../src/lib.ts#LibPluginOptions "embed")` | still a plain link    | replaced by the doc comment and a members table           |

## Examples

- **Inline:** [Twoslash](https://shiki.style/packages/vitepress) (`@shikijs/vitepress-twoslash`) type-checks ` ```ts twoslash ` blocks against the built packages and fails the build on errors. The site build already depends on the package builds.
- **Included:** VitePress [snippet imports](https://vitepress.dev/guide/markdown#import-code-snippets) (`<<< path#region`) pull a `// #region name` block from a real file. Put examples in files that are type-checked and tested like any other source (`*.example.ts`, or a test), so a broken example is a failing test.
- To check: that relative `<<<` paths resolve from the real file when `rewrites` are on.

## Symbol links

One syntax for every language, which stays a plain link on GitHub and for agents: a relative link to the source file, with the symbol path as the fragment (`#Class.method`).

```md
[parse()](../src/parser.py#Parser.parse)
[Lib()](../src/lib.ts#Lib)
[LibPluginOptions](../src/lib.ts#LibPluginOptions "embed")
```

At build time a markdown rule:

1. picks the **handler** for the file's extension;
2. fails the build if the symbol isn't found;
3. rewrites the link to the symbol's API anchor when the page set has one, else to the source line on the git host;
4. with the `"embed"` title, replaces the link with the symbol's rendered docs.

### Handlers

Modelled on [mkdocstrings](https://github.com/mkdocstrings/mkdocstrings) handlers (collect, then render), with two levels so a language can start small:

```ts
interface SymbolHandler {
  extensions: string[];
  /** required: enough for checked links to the source */
  locate(file: string, symbol: string): Promise<{ line: number } | undefined>;
  /** optional: enables embeds; every language renders through the same code */
  describe?(file: string, symbol: string): Promise<SymbolDoc | undefined>;
}

interface SymbolDoc {
  kind: string; // "function", "class", "interface", …
  signature: string;
  docs: string; // markdown
  members: { name: string; type?: string; default?: string; docs: string }[];
}
```

| Language      | Source of the data                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| TypeScript    | `typedoc --json` (TypeDoc is already a dependency)                                                               |
| Python        | [`griffe dump`](https://mkdocstrings.github.io/griffe/) JSON, run with `uvx` so Python tooling stays out of Node |
| anything else | `locate` only, from a regex or universal-ctags                                                                   |

Rejected: [SCIP](https://github.com/sourcegraph/scip) (indexers for many languages, but built for code navigation, heavy, docs only as hover text).

### Source host

`sourceUrl(file, line)` is detected from the git remote and can be overridden with a pattern:

- GitHub: `<repo>/blob/<ref>/<path>#L<line>`
- GitLab: `<repo>/-/blob/<ref>/<path>#L<line>`

The same setting generates the `editLink` pattern, which this repository's config currently writes by hand.
