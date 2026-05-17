import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { mountNav } from "../website/components/nav.ts";
import indexHtml from "../website/index.html?raw";
import viteConfig from "../vite.config.ts?raw";

describe("website logo", () => {
  test("uses the project favicon asset as the visible brand logo", () => {
    const root = document.createElement("div");
    const cleanup = mountNav(root, "/");

    try {
      const logo = root.querySelector<HTMLImageElement>(".brand img");

      expect(logo?.getAttribute("src")).toBe("favicon.svg");
      expect(logo?.getAttribute("src")).not.toBe("/favicon.svg");
      expect(root.querySelector<HTMLAnchorElement>(".brand")?.getAttribute("href")).toBe("#/");
    } finally {
      cleanup();
      root.remove();
    }
  });

  test("uses a relative favicon path for subpath deployments", () => {
    expect(indexHtml).toContain('href="favicon.svg"');
    expect(indexHtml).not.toContain('href="/favicon.svg"');
    expect(viteConfig).toContain('publicDir: "../public"');
  });
});
