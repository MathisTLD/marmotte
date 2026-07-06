const PLUGIN_NAME = "marmotte:dts";

// FIXME: recently migrated to https://www.npmjs.com/package/unplugin-dts
// retro compat might be broken
import { type PluginOptions } from "unplugin-dts";
import _dts from "unplugin-dts/vite";
import type { Plugin, ResolvedConfig } from "vite";

export type { PluginOptions };

// FIXME: make build fail by default if typescript errors (build only not in dev mode)
/**
 * A wrapper around `unplugin-dts` that also exposes the options so that other plugins can use the same TS config
 * without having to copy paste settings
 */
export default function dts(options: PluginOptions = {}): Plugin<{ options: PluginOptions }> {
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
  return plugins[0].api!.options;
}
