import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { collectCases, collectRenderCases } from "../specs/features/index.ts";

describe("spec registry", () => {
  test("collects feature-scoped cases for the website and feature runner", () => {
    const cases = collectCases();

    expect(cases.length).toBeGreaterThan(50);
    expect(cases.every((item) => item.feature && item.id && item.label)).toBe(true);
    expect(cases.some((item) => item.feature === "callout")).toBe(true);
    expect(cases.some((item) => item.feature === "math")).toBe(true);
    expect(cases.some((item) => item.feature === "table")).toBe(true);
  });

  test("projects render cases through stable pretty tags", () => {
    const render = collectRenderCases();
    const inline = document.createElement("span");

    expect(render.code?.("x", inline)).toBe("<c>x</c>");
    expect(render.em?.("x", inline)).toBe("<i>x</i>");
    expect(render.strong?.("x", inline)).toBe("<b>x</b>");
    expect(render.s?.("x", inline)).toBe("<s>x</s>");
    expect(render.mark?.("x", inline)).toBe("<mark>x</mark>");
    expect(render.u?.("x", inline)).toBe("<u>x</u>");
    expect(render.sub?.("x", inline)).toBe("<sub>x</sub>");
    expect(render.sup?.("x", inline)).toBe("<sup>x</sup>");
    expect(render["math-inline"]?.("x", inline)).toBe("<math>x</math>");
    expect(render["math-block"]?.("x", inline)).toBe("$$\nx\n$$");
    expect(render["mark-comment"]?.("<!--x-->", inline)).toBe("<comment><!--x--></comment>");
  });

  test("projects render cases that depend on DOM attributes", () => {
    const render = collectRenderCases();

    const link = document.createElement("a");
    link.setAttribute("href", "https://example.com");
    expect(render.a?.("site", link)).toBe("<l:https://example.com>site</l>");
    link.setAttribute("data-autolink", "");
    expect(render.a?.("https://example.com", link)).toBe(
      "<a:https://example.com>https://example.com</a>",
    );

    const heading = document.createElement("th");
    heading.setAttribute("style", "text-align: center");
    const cell = document.createElement("td");
    cell.setAttribute("style", "text-align: right");
    expect(render.table?.("rows", document.createElement("table"))).toBe("<table>rows</table>");
    expect(render.tr?.("cells", document.createElement("tr"))).toBe("<tr>cells</tr>");
    expect(render.th?.("h", heading)).toBe("<th:center>h</th>");
    expect(render.td?.("d", cell)).toBe("<td:right>d</td>");

    const toc = document.createElement("div");
    toc.className = "toc";
    expect(render.div?.("ignored", toc)).toBe("<toc/>");

    const diagram = document.createElement("div");
    diagram.className = "code-block-node";
    const panel = document.createElement("div");
    panel.className = "diagram-panel";
    panel.setAttribute("data-diagram-state", "success");
    diagram.append(panel);
    expect(render.div?.("code", diagram)).toBe("code\n<diagram:success/>");
  });

  test("projects source-like block render cases without cursor noise", () => {
    const render = collectRenderCases();

    const yaml = document.createElement("div");
    yaml.append(document.createTextNode("a"));
    const caret = document.createElement("span");
    caret.className = "play-caret";
    caret.textContent = "|";
    const selection = document.createElement("span");
    selection.className = "selection-marker";
    selection.textContent = "selected";
    const br = document.createElement("br");
    br.className = "ProseMirror-trailingBreak";
    const plain = document.createElement("span");
    plain.textContent = "bc";
    yaml.append(caret, selection, br, plain);
    expect(render["yaml-block"]?.("", yaml)).toBe('<yaml-block content="abc" />');

    const pre = document.createElement("pre");
    pre.setAttribute("data-lang", "ts");
    const code = document.createElement("code");
    code.append(document.createTextNode("a"));
    const codeCaret = document.createElement("span");
    codeCaret.className = "play-caret";
    code.append(codeCaret, document.createTextNode("b"));
    pre.append(code);
    expect(render.pre?.("", pre)).toBe("```ts\na|b\n```");

    pre.setAttribute("data-lang-focus", "");
    expect(render.pre?.("", pre)).toBe("```ts|\nab\n```");
  });
});
