export type Appearance = "light" | "dark";

export const APPEARANCE_CHANGE_EVENT = "typora-web:appearancechange";

const STORAGE_KEY = "typora-web-appearance";

function supportedAppearance(value: unknown): value is Appearance {
  return value === "light" || value === "dark";
}

function detectAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (supportedAppearance(stored)) return stored;
  } catch {}
  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {}
  return "light";
}

function applyAppearance(value: Appearance): void {
  document.documentElement.dataset.appearance = value;
  document.documentElement.style.colorScheme = value;
}

let currentAppearance: Appearance = detectAppearance();

export function getAppearance(): Appearance {
  return currentAppearance;
}

export function setAppearance(value: Appearance): void {
  currentAppearance = value;
  applyAppearance(value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
  window.dispatchEvent(new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: { appearance: value } }));
}

export function toggleAppearance(): void {
  setAppearance(currentAppearance === "dark" ? "light" : "dark");
}

export function onAppearanceChange(listener: () => void): () => void {
  window.addEventListener(APPEARANCE_CHANGE_EVENT, listener);
  return () => window.removeEventListener(APPEARANCE_CHANGE_EVENT, listener);
}

applyAppearance(currentAppearance);
