import katex from "katex";

export type MathRenderResult = {
  ok: boolean;
  html: string;
  message?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMathToHtml(
  tex: string,
  displayMode: boolean,
): MathRenderResult {
  try {
    const html = katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      trust: false,
      output: "htmlAndMathml",
    });
    const ok = !html.includes("katex-error");
    return ok
      ? { ok: true, html }
      : {
          ok: false,
          html: `<span class="math-error">${escapeHtml(tex)}</span>`,
          message: "Invalid TeX",
        };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      html: `<span class="math-error">${escapeHtml(tex)}</span>`,
      message,
    };
  }
}
