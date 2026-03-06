import { join } from "path";
import { safeWrite } from "../../utils/fs.js";
import type { Template, TemplateOptions } from "./types.js";

export const uiAppTemplate: Template = {
  id: "ui-app",
  label: "Vue/Vuetify UI app",
  async generate(dir, { name, marmotteVersion, includeExamples }: TemplateOptions) {
    await safeWrite(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name,
          version: "0.1.0",
          description: "",
          license: "ISC",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            test: "vitest",
          },
          devDependencies: {
            marmotte: `^${marmotteVersion}`,
            "sass-embedded": "^1.97.3",
            vite: "^7.3.1",
            vitepress: "^2.0.0-alpha.16",
            vitest: "^4.0.18",
            "vue-router": "^5.0.3",
          },
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "vite.config.ts"),
      `/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { UIApp } from "marmotte/vite/ui";

export default defineConfig({
  plugins: [
    UIApp({
      root: import.meta.dirname,
      lib: { dts: { tsconfigPath: "./tsconfig.app.json" } },
    }),
  ],
});
`,
    );

    await safeWrite(
      join(dir, "tsconfig.json"),
      JSON.stringify(
        {
          files: [],
          references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "tsconfig.app.json"),
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.vue.json",
          include: ["src/**/*", "src/**/*.vue"],
          exclude: [],
          compilerOptions: { paths: { "@/*": ["./src/*"] } },
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "tsconfig.node.json"),
      JSON.stringify(
        {
          extends: "marmotte/tsconfig/tsconfig.vite-config.json",
          include: ["vite.config.*"],
        },
        null,
        2,
      ) + "\n",
    );

    await safeWrite(
      join(dir, "index.html"),
      `<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    );

    await safeWrite(
      join(dir, "src/main.ts"),
      `import { createApp } from "vue";
import App from "./App.vue";

import router from "./router";
import vuetify from "./vuetify";

const app = createApp(App);

app.use(router).use(vuetify);

app.mount("#app");
`,
    );

    await safeWrite(
      join(dir, "src/App.vue"),
      `<template>
  <RouterView />
</template>
`,
    );

    await safeWrite(
      join(dir, "src/router.ts"),
      `import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

export default createRouter({
  history: createWebHistory(),
  routes,
});
`,
    );

    await safeWrite(
      join(dir, "src/vuetify.ts"),
      `// Styles
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

export default createVuetify({});
`,
    );

    await safeWrite(
      join(dir, "src/pages/index.vue"),
      includeExamples
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
    );
  },
};
