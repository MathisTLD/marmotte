const PLUGIN_NAME = "marmotte:dts";

// TODO: replace by https://www.npmjs.com/package/unplugin-dts once stable
import _dts, { type PluginOptions } from "vite-plugin-dts";
import type { ResolvedConfig } from "vite";

export type { PluginOptions };

/**
 * A wrapper around `vite-plugin-dts` that also exposes the options so that other plugins can use the same TS config
 * without having to copy paste settings
 */
export default function dts(options: PluginOptions = {}) {
  const _plugins = _dts(options);
  return {
    ..._plugins,
    name: PLUGIN_NAME,
    api: {
      options,
    },
  };
}
type DTSPlugin = ReturnType<typeof dts>;

export function getDTSPlugin(config: ResolvedConfig): DTSPlugin[] {
  return config.plugins.filter((p) => p.name === PLUGIN_NAME) as DTSPlugin[];
}

export function getDTSPluginOptions(config: ResolvedConfig) {
  const plugins = getDTSPlugin(config);
  if (plugins.length === 0) throw new TypeError(`Plugin ${PLUGIN_NAME} not found`);
  if (plugins.length > 1)
    throw new TypeError(
      `Found ${plugins.length} instances of plugin ${PLUGIN_NAME}. Can't resolve options`,
    );
  return plugins[0].api.options;
}
