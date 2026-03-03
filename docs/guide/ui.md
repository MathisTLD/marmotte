---
title: Vue UI Library / App
---

# Vue UI Library and Application

Marmotte provides three composable plugins for Vue 3 + Vuetify projects. All of them include the same base setup: Vue, [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) (auto-import), and Vuetify.

| Plugin | Use case |
|---|---|
| [`UILib`](/reference/api/vite/ui#uilib) | Distributable Vue component library |
| [`UIApp`](/reference/api/vite/ui#uiapp) | Full Vue application (with vue-router) |
| [`UICommon`](/reference/api/vite/ui#uicommon) | Shared base — use when composing your own stack |

## Building a Vue component library

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { UILib } from "marmotte/vite/ui"

export default defineConfig({
  plugins: UILib({}),
})
```

`UILib` extends `Lib` with Vue-specific additions:

- All `.vue` files in `src/` are added as entry points alongside TypeScript entries.
- A single `style.css` is produced, bundling all component styles.
- `unplugin-vue-components` writes auto-import declarations to `src/components.d.ts`.

### Vuetify and Sass

Vuetify requires `sass-embedded`. Install it explicitly:

```sh
npm install --save-dev sass-embedded
```

To disable Vuetify entirely (e.g. for a non-Vuetify component library):

```ts
UILib({ vuetify: false })
```

## Building a Vue application

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { UIApp } from "marmotte/vite/ui"

export default defineConfig({
  plugins: UIApp({}),
})
```

`UIApp` adds `vue-router/vite` on top of `UICommon`. The router plugin must come before `@vitejs/plugin-vue`, which marmotte handles automatically.

`vue-router` writes typed router declarations to `src/typed-router.d.ts`.

To disable the router:

```ts
UIApp({ vueRouter: false })
```

## Options

All three plugins share a common set of options through `UICommonPluginOptions`:

```ts
UILib({
  // Options passed directly to @vitejs/plugin-vue
  vue: { /* ... */ },

  // Options for unplugin-vue-components
  vueComponents: { /* ... */ },

  // Options for vite-plugin-vuetify, or false to disable
  vuetify: { styles: { configFile: "src/styles/settings.scss" } },
})
```

`UILib` additionally accepts all [`LibPluginOptions`](/reference/api/vite/lib#libpluginoptions) (entries, dts, externals, docs).

`UIApp` additionally accepts `vueRouter` options or `false`.

See the [API reference](/reference/api/vite/ui) for full option types.

## Using `UICommon` directly

`UICommon` is the shared foundation. It returns the plugin array augmented with a `ctx` property for accessing the resolved [`DefaultVitePluginContext`](/reference/api/vite/lib/context#defaultviteplugincontext):

```ts
import { UICommon } from "marmotte/vite/ui"

const common = UICommon({})
const { ctx } = common

// ctx.resolve("sourceDir") → /abs/path/to/src
```

This is useful when composing your own plugin stack on top of the shared Vue/Vuetify setup.
