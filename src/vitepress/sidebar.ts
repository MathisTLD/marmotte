// re-export from vitepress-sidebar so that users don't have to install the package themselves

import type { Plugin } from "vite";
import type { VitePressSidebarOptions } from "vitepress-sidebar/types";
import { generateSidebar } from "vitepress-sidebar";
import type { SiteConfig } from "vitepress";
import { getVitePressConfig } from "./utils";
import { relative } from "path";
import { withDefaults, type WithNoDefaults } from "@/utils/merge";

export * from "vitepress-sidebar";

type SidebarOptions = WithNoDefaults<VitePressSidebarOptions>;

export default function SidebarPlugin(options: SidebarOptions | SidebarOptions[] = {}) {
  let resolvedOptions: VitePressSidebarOptions | VitePressSidebarOptions[];
  let vitepressConfig: SiteConfig;

  function buildSidebar() {
    console.log("🏗️ generating sidebar...");
    vitepressConfig.userConfig.themeConfig.sidebar = generateSidebar(resolvedOptions);
  }

  return {
    name: "marmotte:vitepress-sidebar",
    enforce: "post",
    config(cfg) {
      function resolveSidebarOptions(opts: SidebarOptions): VitePressSidebarOptions {
        const { root } = cfg;
        if (!root) throw new TypeError("Unable to resolve vitepress root");
        return withDefaults<VitePressSidebarOptions>(
          {
            // vitepress-sidebar joins documentRootPath with process.cwd() internally,
            // so this must be relative to CWD (= project root when running vitepress normally)
            documentRootPath: relative(process.cwd(), root),
            collapsed: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useTitleFromFileHeading: true,
            useFolderTitleFromIndexFile: true,
          },
          opts,
        );
      }
      resolvedOptions = Array.isArray(options)
        ? options.map(resolveSidebarOptions)
        : resolveSidebarOptions(options);
      vitepressConfig = getVitePressConfig(cfg);
      buildSidebar();
    },
    configureServer(server) {
      const { root } = server.config;
      const onFileChange = (file: string) => {
        if (!file.endsWith(".md") || !file.startsWith(root)) return;
        // TODO: auto-reload sidebar when pages are added/removed
        server.config.logger.info(
          "Page added/removed — restart the dev server to update the sidebar.",
        );
      };
      server.watcher.on("add", onFileChange);
      server.watcher.on("unlink", onFileChange);
    },
  } satisfies Plugin;
}
