import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import contributing from "../CONTRIBUTING.md?raw";
import readme from "../README.md?raw";

describe("project documentation language order", () => {
  test("README starts with a Chinese overview before the English guide", () => {
    expect(readme.startsWith("# typora-web\n\n## 中文简介\n")).toBe(true);
    expect(readme.indexOf("## 中文简介")).toBeLessThan(readme.indexOf("## English Overview"));
  });

  test("CONTRIBUTING starts with Chinese contribution guidance", () => {
    expect(contributing.startsWith("# Contributing\n\n## 中文贡献指南\n")).toBe(true);
    expect(contributing.indexOf("## 中文贡献指南")).toBeLessThan(
      contributing.indexOf("## English Guide"),
    );
  });
});
