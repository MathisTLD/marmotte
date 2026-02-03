import type { PluginOption } from "vite";
import { Lib, type LibPluginOptions } from "./lib";

import Vue, { type Options as VuePluginOptions } from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";
import VueComponents from "unplugin-vue-components/vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import { DefaultVitePluginContext, type contextOptions } from "../context";
import { resolveEntries } from "@/utils/fs";

type VueComponentsPluginOptions = Parameters<typeof VueComponents>[0];
type VuetifyPluginOptions = Parameters<typeof Vuetify>[0];
type VueRouterPluginOptions = Parameters<typeof VueRouter>[0];

export interface UICommonPluginOptions extends contextOptions<DefaultVitePluginContext> {
  lib?: LibPluginOptions;
  vue?: VuePluginOptions;
  vueComponents?: VueComponentsPluginOptions;
  /** Options for `vite-plugin-vuetify` or `false` to deactivate */
  vuetify?: VuetifyPluginOptions | false;
}

export function UICommon(
  options: UICommonPluginOptions,
): PluginOption[] & { ctx: DefaultVitePluginContext } {
  const plugin: PluginOption = [];
  const ctx = new DefaultVitePluginContext(options);

  const vuePluginOptions: VuePluginOptions = {};
  if (options.vuetify !== false) {
    vuePluginOptions.template = { transformAssetUrls };
  }
  // TODO: proper deep merge
  Object.assign(vuePluginOptions, options.vue ?? {});

  const vueComponentsPluginOptions: VueComponentsPluginOptions = {
    dts: ctx.resolve("sourceDir", "components.d.ts"),
  };
  // TODO: proper deep merge
  Object.assign(vueComponentsPluginOptions, options.vueComponents ?? {});

  // common
  plugin.push(
    Lib(options.lib),
    Vue(vuePluginOptions),
    VueComponents(vueComponentsPluginOptions),
  );
  if (options.vuetify !== false) {
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    plugin.push(Vuetify(options.vuetify));
  }
  // also give a ref to context so it can be reused
  return Object.assign(plugin, { ctx });
}

/**
 * Configures vite to build a vue UI library
 * uses `unplugin-vue-components` and `vuetify` by default
 */
export function UILib(options: UICommonPluginOptions): PluginOption {
  const common = UICommon(options);
  const { ctx } = common;

  return [
    common,
    {
      name: "marmotte-ui-lib",

      async config() {
        return {
          build: {
            lib: {
              cssFileName: "style",
              // should be merged with entries added by the `Lib` plugin
              // add .vue files as entries
              entry: await resolveEntries(ctx.resolve("sourceDir"), /\.vue$/),
            },
          },
          resolve: {
            // adds to to default extensions handled by `Lib` plugin
            extensions: [".vue"],
          },
        };
      },
    },
  ];
}

export interface UIAppPluginOptions extends UICommonPluginOptions {
  vueRouter?: VueRouterPluginOptions | false;
}

/**
 * Configures vite to build a vue UI library
 * uses similar setup as {@link Lib} with `unplugin-vue-router` on top
 */
export function UIApp(options: UIAppPluginOptions) {
  const common = UICommon(options);
  const { ctx } = common;
  const plugin: PluginOption = [];
  if (options.vueRouter !== false) {
    const opts: VueRouterPluginOptions = {
      dts: ctx.resolve("sourceDir", "typed-router.d.ts"),
    };
    Object.assign(opts, options.vueRouter ?? {});
    plugin.push(VueRouter(opts));
  }

  plugin.push(...common, {
    name: "marmotte-ui-app",
    async config() {
      return {
        resolve: {
          // adds to to default extensions handled by `Lib` plugin
          extensions: [".vue"],
        },
      };
    },
  });

  return plugin;
}
