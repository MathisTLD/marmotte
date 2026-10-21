/**
 * Programmatic API for the marmotte CLI.
 * Useful for testing, codegen pipelines, and complex scaffolding scenarios.
 */
export { resolveTemplate, builtinTemplates } from "./templates/index.js";
export type { Template, TemplateOptions } from "./templates/types.js";
export { runCreate } from "./create.js";
export type { CreateOptions } from "./create.js";
export { runSetup } from "./setup.js";
export type { SetupOptions } from "./setup.js";
export { features } from "./features/index.js";
export type { Feature, PackageJson } from "./features/index.js";
