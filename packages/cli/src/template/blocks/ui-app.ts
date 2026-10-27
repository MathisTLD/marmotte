import { base } from "../base.js";
import { blockPackageJson } from "./package-json.js";
import { commonDevDependencies, tsconfigFiles } from "./shared.js";

export const blockUIAppBuild = base.createBlock({
  about: { name: "UI app build" },
  produce({ options }) {
    return {
      files: {
        "vite.config.ts": `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UIApp } from "@mrmt/vite-ui";

export default defineConfig({
  plugins: [
    UIApp({
      root: import.meta.dirname,
      lib: { dts: { tsconfigPath: "./tsconfig.app.json" } },
    }),
  ],
});
`,
        ...tsconfigFiles("app", {
          extends: "@mrmt/tsconfig/tsconfig.vue.json",
          include: ["src/**/*", "src/**/*.vue"],
          exclude: [],
          compilerOptions: { paths: { "@/*": ["./src/*"] } },
        }),
      },
      addons: [
        blockPackageJson({
          scripts: { dev: "vite", build: "vite build", test: "vitest" },
          devDependencies: {
            ...commonDevDependencies(options),
            "@mrmt/vite-ui": `^${options.marmotteVersion}`,
            "sass-embedded": "^1.97.3",
            "vue-router": "^5.0.3",
          },
        }),
      ],
    };
  },
});

/** The app's own entry points: starter code, created once and then yours. */
export const blockUIAppStarter = base.createBlock({
  about: { name: "UI app starter" },
  setup({ options }) {
    return {
      files: {
        "index.html": `<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
        src: {
          "main.ts": `import { createApp } from "vue";
import App from "./App.vue";

import router from "./router";
import vuetify from "./vuetify";

const app = createApp(App);

app.use(router).use(vuetify);

app.mount("#app");
`,
          "App.vue": `<template>
  <RouterView />
</template>
`,
          "router.ts": `import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

export default createRouter({
  history: createWebHistory(),
  routes,
});
`,
          "vuetify.ts": `// Styles
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

export default createVuetify({});
`,
          pages: {
            "index.vue": options.includeExamples
              ? `<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <v-card title="Hello World">
              <v-card-text>
                <p>Welcome to your new Vuetify app!</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
`
              : `<template>
  <v-app>
    <v-main />
  </v-app>
</template>
`,
          },
        },
      },
    };
  },
});
