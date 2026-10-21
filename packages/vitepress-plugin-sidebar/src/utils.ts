import type { UserConfig } from "vite";
import type { SiteConfig } from "vitepress";

/**
 * Allow to resolve vitepress config from a vite plugin's `config` hook
 * @param config
 * @returns
 */
export function getVitePressConfig(config: UserConfig) {
  if (!("vitepress" in config)) throw new Error("failed to get vitepress config");
  const vitepressConfig = config.vitepress as SiteConfig;
  // TODO: might need further checks
  return vitepressConfig;
}
