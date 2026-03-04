/** Context passed to every template's `generate` function. */
export interface TemplateOptions {
  /** Project name substituted into `package.json` and other template files. */
  name: string;
  /** Marmotte version substituted into `package.json` as the `marmotte` devDependency version. */
  marmotteVersion: string;
  /** Whether to include example source files in the generated project. */
  includeExamples: boolean;
}

/**
 * A project template that can scaffold a directory from scratch.
 *
 * Built-in templates are identified by a short `id` string. Custom templates
 * can be created by implementing this interface and passing the instance to
 * {@link bootstrapTypeDoc} or using it directly.
 */
export interface Template {
  /** Short identifier (e.g. `"node-library"`). Used to look up templates by name. */
  id: string;
  /** Human-readable label shown in the interactive prompt and spinner. */
  label: string;
  /**
   * Generate the project in `dir`.
   * @param dir Absolute path to the target directory (created if it doesn't exist).
   * @param options Template context — name, marmotte version, example flag.
   */
  generate(dir: string, options: TemplateOptions): Promise<void>;
}
