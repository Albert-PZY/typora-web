import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import contributing from "../CONTRIBUTING.md?raw";
import readme from "../README.md?raw";
import syntaxSurvey from "../docs/typora-syntax-survey.md?raw";

describe("project documentation language order", () => {
  test("README starts with a Chinese overview before the English guide", () => {
    expect(readme.startsWith("# typora-web\n\n## 中文简介\n")).toBe(true);
    expect(readme.indexOf("## 中文简介")).toBeLessThan(readme.indexOf("## English Overview"));
    expect(readme).toContain("## 技术选型");
    expect(readme).toContain("## 安装");
    expect(readme).toContain("## 控制器 API");
    expect(readme).toContain("## Markdown 支持");
    expect(readme).toContain("## 架构");
    expect(readme).toContain("## 开发");
    expect(readme).toContain("TypeScript");
    expect(readme).toContain("ProseMirror");
    expect(readme).toContain("CodeMirror 6");
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
    expect(syntaxSurvey).toContain("CodeMirror 6 highlighting");
    expect(syntaxSurvey).not.toContain(
      "| Callouts / GitHub alerts | Backlog |",
    );
    expect(syntaxSurvey).not.toContain(
      "| Bare URL autolinks | Backlog |",
    );
  });
});
