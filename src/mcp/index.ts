import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runCreate } from "../cli/create.js";
import { runSetup } from "../cli/setup.js";
import { builtinTemplates } from "../cli/templates/index.js";
import { features } from "../cli/features/index.js";

declare const __MARMOTTE_VERSION__: string;

/** Redirect clack UI output to stderr so it doesn't corrupt the MCP stdio JSON-RPC framing. */
async function withStderrAsStdout<T>(fn: () => Promise<T>): Promise<T> {
  const real = process.stdout;
  Object.defineProperty(process, "stdout", { value: process.stderr, configurable: true });
  try {
    return await fn();
  } finally {
    Object.defineProperty(process, "stdout", { value: real, configurable: true });
  }
}

const server = new McpServer({ name: "marmotte", version: __MARMOTTE_VERSION__ });

// Resources — let agents discover available templates and features
server.registerResource(
  "templates",
  "marmotte://templates",
  { title: "Available templates", mimeType: "application/json" },
  async () => ({
    contents: [
      {
        uri: "marmotte://templates",
        mimeType: "application/json",
        text: JSON.stringify(
          builtinTemplates.map((t) => ({ id: t.id, label: t.label })),
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerResource(
  "features",
  "marmotte://features",
  { title: "Available features", mimeType: "application/json" },
  async () => ({
    contents: [
      {
        uri: "marmotte://features",
        mimeType: "application/json",
        text: JSON.stringify(
          features.map((f) => ({ id: f.id, label: f.label })),
          null,
          2,
        ),
      },
    ],
  }),
);

const featureIds = features.map((f) => f.id) as [string, ...string[]];

// Tool: create
server.registerTool(
  "create",
  {
    title: "Create project",
    description:
      "Scaffold a new TypeScript project. Built-in templates: node-library, ui-library, ui-app. Also accepts GitHub shorthand (user/repo), giget sources, or local paths.",
    inputSchema: z.object({
      dir: z.string().describe("Target directory (e.g. './my-lib')"),
      template: z
        .string()
        .describe(
          "Template ID or source. Built-ins: node-library | ui-library | ui-app. Also: user/repo, github:user/repo, https://…, ./local/path",
        ),
      name: z
        .string()
        .optional()
        .describe("Project name for package.json. Defaults to directory basename."),
      examples: z
        .boolean()
        .optional()
        .describe("Include example source files (default: true). Built-in templates only."),
      features: z
        .array(z.enum(featureIds))
        .optional()
        .describe("Feature IDs to apply after scaffolding."),
    }),
  },
  async (input) => {
    await withStderrAsStdout(() => runCreate(input));
    return { content: [{ type: "text" as const, text: `Project created in ${input.dir}.` }] };
  },
);

// Tool: setup
server.registerTool(
  "setup",
  {
    title: "Setup project features",
    description:
      "Add tooling features to an existing project. Patches package.json and runs npm install.",
    inputSchema: z.object({
      dir: z
        .string()
        .optional()
        .describe("Project root path. Defaults to current working directory."),
      features: z
        .array(z.enum(featureIds))
        .min(1)
        .describe("Feature IDs to apply: lint | format | pre-commit | changesets"),
    }),
  },
  async (input) => {
    await withStderrAsStdout(() => runSetup(input));
    return {
      content: [
        {
          type: "text" as const,
          text: `Features applied${input.dir ? ` in ${input.dir}` : ""}.`,
        },
      ],
    };
  },
);

await server.connect(new StdioServerTransport());
