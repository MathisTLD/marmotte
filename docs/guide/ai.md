---
title: AI Integration
---

# AI Integration

Marmotte ships a built-in MCP server (`marmotte-mcp`) that lets any MCP-compatible AI host scaffold and configure projects without writing a single command. It also exposes a [programmatic API](#programmatic-api) for Node.js scripts and AI-generated code.

> **What is MCP?** The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets AI assistants call external tools. Once a server is registered, the AI can invoke `create` or `setup` the same way it calls any other tool — no glue code needed.

---

## Step 1 — Install marmotte globally

The `marmotte-mcp` binary is bundled inside the `marmotte` npm package. Installing it globally makes the server available to every AI host on your machine:

```sh
npm install -g marmotte
```

Verify it works:

```sh
marmotte-mcp --version   # should print the version and exit
```

> **No global install?** You can use `npx marmotte-mcp` everywhere below instead. npx downloads and caches the package on first run.

---

## Step 2 — Register the server in your AI host

Pick the host you use.

### Claude Code (CLI)

Run this once — it writes to your user-level config so the server is available in every project:

```sh
claude mcp add --scope user marmotte -- marmotte-mcp
```

Verify it was added:

```sh
claude mcp list
```

> See the [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for the full reference on scopes, environment variables, and project-level `.mcp.json` files.

### Claude Desktop

Open the config file in a text editor:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the `marmotte` entry inside `mcpServers` (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "marmotte": {
      "command": "marmotte-mcp"
    }
  }
}
```

Then **restart Claude Desktop**. The server appears in the tool list on the next launch.

> See the [Claude Desktop MCP guide](https://support.anthropic.com/en/articles/10168395-setting-up-claude-for-desktop) for screenshots and troubleshooting.

### Cursor

Open or create `.cursor/mcp.json` in your home directory for a global setup:

```sh
# macOS / Linux
~/.cursor/mcp.json

# Windows
%USERPROFILE%\.cursor\mcp.json
```

```json
{
  "mcpServers": {
    "marmotte": {
      "command": "marmotte-mcp"
    }
  }
}
```

For a project-scoped setup, place the file at `.cursor/mcp.json` in the project root instead.

> See the [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for the full reference.

---

## Step 3 — Use the tools

Once the server is registered, ask your AI assistant to scaffold a project naturally:

> *"Create a new TypeScript library in `./packages/logger` using the node-library template, no examples, with lint and format."*

The assistant will call the `create` tool with the right inputs. No copy-pasting commands.

### Available tools

#### `create` — scaffold a new project

| Input | Type | Description |
|-------|------|-------------|
| `dir` | `string` | Target directory, e.g. `"./my-lib"` |
| `template` | `string` | Template ID or source (see below) |
| `name` | `string?` | Package name. Defaults to directory basename. |
| `examples` | `boolean?` | Include example files (default: `true`). Built-in templates only. |
| `features` | `string[]?` | Feature IDs to apply after scaffolding. |

**Template values:**

| Value | Meaning |
|-------|---------|
| `node-library` | TypeScript library with `Lib()`, DTS, and docs |
| `ui-library` | Vue 3 + Vuetify component library |
| `ui-app` | Vue 3 + Vuetify SPA |
| `user/repo` | GitHub shorthand — downloaded via [giget](https://github.com/unjs/giget) |
| `github:user/repo` | Explicit giget source |
| `./path/to/template` | Local directory |

#### `setup` — add tooling to an existing project

| Input | Type | Description |
|-------|------|-------------|
| `dir` | `string?` | Project root. Defaults to current working directory. |
| `features` | `string[]` | Feature IDs to apply (at least one required). |

**Feature IDs:** `lint`, `format`, `pre-commit`, `changesets`, `version-lifecycle`

### Resources

The server also exposes two resources that the AI can read to discover valid values before calling a tool:

| URI | Contents |
|-----|----------|
| `marmotte://templates` | JSON list of `{ id, label }` for each built-in template |
| `marmotte://features` | JSON list of `{ id, label }` for each available feature |

---

## Programmatic API

For scripts and AI-generated code that need to call the CLI logic directly, import from `marmotte/cli/api`:

```ts
import { runCreate, runSetup } from "marmotte/cli/api";

// Fully non-interactive when template is supplied
await runCreate({
  dir: "./my-lib",
  template: "node-library",
  name: "my-lib",
  examples: false,
  features: ["lint", "format"],
});

// Add features to an existing project
await runSetup({
  dir: "./packages/my-lib",
  features: ["lint", "format", "pre-commit"],
});
```

Omit any field to fall back to interactive prompts for that field. Supplying `template` in `runCreate` disables all prompts.

### Discover templates and features at runtime

```ts
import { builtinTemplates, features } from "marmotte/cli/api";

builtinTemplates.map((t) => t.id);
// ["node-library", "ui-library", "ui-app"]

features.map((f) => f.id);
// ["lint", "format", "pre-commit", "changesets"]
```

### Types

```ts
import type { CreateOptions, SetupOptions, Feature, PackageJson } from "marmotte/cli/api";
```

| Type | Description |
|------|-------------|
| `CreateOptions` | Options for `runCreate` |
| `SetupOptions` | Options for `runSetup` |
| `Feature` | `{ id, label, apply(dir, pkg) }` |
| `PackageJson` | Minimal `package.json` shape used by features |
