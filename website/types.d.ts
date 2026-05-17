// Vite ?raw / ?url import declarations for TS. The website uses
// `import preset from "./preset.md?raw"` to embed raw markdown.

declare module "*.md?raw" {
  const text: string;
  export default text;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}
