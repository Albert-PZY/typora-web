import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { parse } from "../src/parser.ts";
import { serialize } from "../src/serializer.ts";
import { pretty, setup } from "./utils.ts";

const markdown = [
  "---",
  "typora-root-url: https://cdn.example.com/assets",
  "---",
  "",
  "![Alt](/images/photo.png)",
].join("\n");

describe("typora-root-url image preview", () => {
  test("renders root-relative image URLs through typora-root-url", () => {
    expect(pretty(setup(markdown))).toContain(
      "<img:https://cdn.example.com/assets/images/photo.png>Alt</img>",
    );
  });

  test("keeps markdown round-trip stable", () => {
    expect(serialize(parse(markdown))).toBe(markdown);
  });
});
