import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import manualReleaseWorkflow from "../.github/workflows/release.yml?raw";
import contributing from "../CONTRIBUTING.md?raw";
import readme from "../README.md?raw";
import readmeZh from "../README_zh-CN.md?raw";
import syntaxSurvey from "../docs/typora-syntax-survey.md?raw";

const normalizeLineEndings = (value: string) => value.replace(/\r\n?/g, "\n");

describe("project documentation language order", () => {
  test("README is English by default and links to the Chinese guide", () => {
    expect(normalizeLineEndings(readme).startsWith(
      "[中文](README_zh-CN.md)\n\n" +
        "<p align=\"center\">\n" +
        "  <img src=\"public/favicon.svg\" alt=\"Typora-Web logo\" width=\"96\" />\n" +
        "</p>\n\n" +
        "# Typora-Web\n",
    )).toBe(true);
    expect(readme).toContain("## Technical Choices");
    expect(readme).toContain("## Attribution");
    expect(readme).toContain("[Yuyz0112/typora-web][original-typora-web]");
    expect(readme).toContain("Yanzhen Yu");
    expect(readme).toContain("## Install");
    expect(readme).toContain("## Controller API");
    expect(readme).toContain("## Markdown Support");
    expect(readme).toContain("## Architecture");
    expect(readme).toContain("## Development");
    expect(readme).toContain("```mermaid\nflowchart TD");
    expect(readme).toContain("Writer in the browser");
    expect(readme).toContain("defaultPlugins feature stack");
    expect(readme).toContain("TypeScript");
    expect(readme).toContain("ProseMirror");
    expect(readme).toContain("CodeMirror 6");
    expect(readme).not.toContain("## 中文简介");
  });

  test("Chinese README links back to the English guide", () => {
    expect(normalizeLineEndings(readmeZh).startsWith(
      "[English](README.md)\n\n" +
        "<p align=\"center\">\n" +
        "  <img src=\"public/favicon.svg\" alt=\"Typora-Web 标志\" width=\"96\" />\n" +
        "</p>\n\n" +
        "# Typora-Web\n",
    )).toBe(true);
    expect(readmeZh).toContain("## 技术选型");
    expect(readmeZh).toContain("## 来源与致谢");
    expect(readmeZh).toContain("[Yuyz0112/typora-web][original-typora-web]");
    expect(readmeZh).toContain("Yanzhen Yu");
    expect(readmeZh).toContain("## 安装");
    expect(readmeZh).toContain("## 控制器 API");
    expect(readmeZh).toContain("## Markdown 支持");
    expect(readmeZh).toContain("## 架构");
    expect(readmeZh).toContain("## 开发");
    expect(readmeZh).toContain("```mermaid\nflowchart TD");
    expect(readmeZh).toContain("浏览器中的作者");
    expect(readmeZh).toContain("defaultPlugins 功能栈");
    expect(readmeZh).toContain("TypeScript");
    expect(readmeZh).toContain("ProseMirror");
    expect(readmeZh).toContain("CodeMirror 6");
  });

  test("CONTRIBUTING starts with Chinese contribution guidance", () => {
    expect(contributing.startsWith("# Contributing\n\n## 中文贡献指南\n")).toBe(true);
    expect(contributing.indexOf("## 中文贡献指南")).toBeLessThan(
      contributing.indexOf("## English Guide"),
    );
    expect(contributing).toContain("## 项目原则");
    expect(contributing).toContain("## 开发环境");
    expect(contributing).toContain("## 功能开发流程");
    expect(contributing).toContain("## 提交规则");
    expect(contributing).toContain("## 发布");
  });

  test("syntax survey reflects implemented demo features", () => {
    expect(syntaxSurvey).toContain(
      "| Callouts / GitHub alerts | Supported |",
    );
    expect(syntaxSurvey).toContain("| Underline | Supported |");
    expect(syntaxSurvey).toContain("| Bare URL autolinks | Supported |");
    expect(syntaxSurvey).toContain("| Image size extensions | Partial |");
    expect(syntaxSurvey).toContain("mermaid@11.15.0");
    expect(syntaxSurvey).toContain("CodeMirror 6 highlighting");
    expect(syntaxSurvey).not.toContain(
      "| Callouts / GitHub alerts | Backlog |",
    );
    expect(syntaxSurvey).not.toContain(
      "| Bare URL autolinks | Backlog |",
    );
  });

  test("manual release notes come from CHANGELOG instead of generated notes", () => {
    expect(manualReleaseWorkflow).toContain("CHANGELOG.md");
    expect(manualReleaseWorkflow).toContain("--notes-file release-notes.md");
    expect(manualReleaseWorkflow).not.toContain("--generate-notes");
  });
});
