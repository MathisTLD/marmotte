import type { Plugin } from "vite";
import { Lib, type LibPluginOptions } from "./lib";
import { BaseBundle } from "./base-config";

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
  vue?: VuePluginOptions;
  vueComponents?: VueComponentsPluginOptions;
  /** Options for `vite-plugin-vuetify` or `false` to deactivate */
  vuetify?: VuetifyPluginOptions | false;
}

export function UICommon(
  options: UICommonPluginOptions,
): (Plugin | Plugin[])[] & { ctx: DefaultVitePluginContext } {
  const plugin: (Plugin | Plugin[])[] = [];
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
    ...BaseBundle(),
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

export interface UILibPluginOptions
  extends LibPluginOptions, UICommonPluginOptions {
  vue?: VuePluginOptions;
  vueComponents?: VueComponentsPluginOptions;
  /** Options for `vite-plugin-vuetify` or `false` to deactivate */
  vuetify?: VuetifyPluginOptions | false;
}

/**
 * Configures vite to build a vue UI library
 * uses `unplugin-vue-components` and `vuetify` by default
 */
export function UILib(options: UILibPluginOptions): Plugin[] {
  const common = UICommon(options);
  const { ctx } = common;

  return [
    ...common.flat(1),
    ...Lib(options),
    {
      name: "marmotte:ui-lib-config",
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
  const plugin: (Plugin | Plugin[])[] = [];
  if (options.vueRouter !== false) {
    const opts: VueRouterPluginOptions = {
      dts: ctx.resolve("sourceDir", "typed-router.d.ts"),
    };
    Object.assign(opts, options.vueRouter ?? {});
    // add router before common because it must be before @vitejs/plugin-vue
    plugin.push(VueRouter(opts));
  }

  plugin.push(...common.flat());

  return plugin;
}
