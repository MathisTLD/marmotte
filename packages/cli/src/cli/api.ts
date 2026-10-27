/**
 * Programmatic API for the marmotte CLI.
 * Useful for testing, codegen pipelines, and complex scaffolding scenarios.
 */
export { runCreate } from "./create.js";
export type { CreateOptions } from "./create.js";
export { runSetup } from "./setup.js";
export type { SetupOptions } from "./setup.js";
export { applyTemplate } from "./scaffold.js";
export type { ApplyTemplateOptions } from "./scaffold.js";
export { templates, features } from "../template/index.js";
