import { lintFeature } from "./lint.js";
import { formatFeature } from "./format.js";
import { preCommitFeature } from "./pre-commit.js";
import { changesetsFeature } from "./changesets.js";

/** Minimal `package.json` shape used by features when reading/writing project metadata. */
export interface PackageJson {
  name: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * A CLI feature that can be applied to an existing project.
 *
 * Features mutate the in-memory `pkg` object (adding scripts and devDependencies)
 * and may also write additional config files to `dir`. The caller is responsible
 * for writing `package.json` back to disk after all features have run.
 */
export interface Feature {
  /** Unique identifier used as the CLI flag value (e.g. `"lint"`, `"format"`). */
  id: string;
  /** Human-readable label shown in the interactive prompt. */
  label: string;
  /**
   * Apply the feature to a project.
   * @param dir Absolute path to the project root.
   * @param pkg In-memory `package.json` object to mutate.
   */
  apply(dir: string, pkg: PackageJson): Promise<void>;
}

/** All built-in features available via `marmotte create` and `marmotte setup`. */
export const features: Feature[] = [lintFeature, formatFeature, preCommitFeature, changesetsFeature];
