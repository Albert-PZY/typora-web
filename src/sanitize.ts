import DOMPurify from "dompurify";

const URL_ATTRS = new Set(["href", "src", "xlink:href", "action", "formaction"]);
const UNSAFE_URL_RE = /^[\u0000-\u001F\s]*javascript:/i;

function stripUnsafeUrls(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const el of template.content.querySelectorAll("*")) {
    for (const attr of Array.from(el.attributes)) {
      if (URL_ATTRS.has(attr.name.toLowerCase()) && UNSAFE_URL_RE.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return template.innerHTML;
}

export function sanitizeHtml(rawHtml: string): string {
  const sanitized = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    RETURN_TRUSTED_TYPE: false,
  });
  return stripUnsafeUrls(sanitized);
}
