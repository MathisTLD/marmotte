type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Recursively merges two objects.
 * - Plain object values are merged recursively.
 * - Array values are concatenated (base first, then override).
 * - All other values: override wins. `undefined` in override is skipped.
 */
export function deepMerge<T extends object, U extends object>(base: T, override: U): T & U {
  const result = { ...base } as PlainObject;
  for (const key of Object.keys(override)) {
    const overrideVal = (override as PlainObject)[key];
    if (overrideVal === undefined) continue;
    const baseVal = result[key];
    if (Array.isArray(baseVal) && Array.isArray(overrideVal)) {
      result[key] = [...baseVal, ...overrideVal];
    } else if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T & U;
}

/**
 * Extends an options type with `noDefaults` to opt out of default injection.
 * Used with {@link withDefaults}.
 */
export type WithNoDefaults<T> = T & {
  /**
   * When `true`, skip all defaults and use the provided options as-is
   * without merging with plugin defaults.
   * @default false
   */
  noDefaults?: boolean;
};

/**
 * Merges `defaults` with `options` using {@link deepMerge}.
 * Pass `noDefaults: true` in `options` to skip defaults entirely.
 */
export function withDefaults<T extends object>(
  defaults: Partial<T>,
  options?: WithNoDefaults<T>,
): T {
  if (!options) return { ...defaults } as T;
  const { noDefaults, ...rest } = options;
  if (noDefaults) return rest as unknown as T;
  return deepMerge(defaults as object, rest as object) as T;
}
