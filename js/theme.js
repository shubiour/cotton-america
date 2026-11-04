// Theme switch: Auto (follow device) → Light → Dark
import { $, readStore, writeStore } from "./utils.js";

const MODES = ["auto", "light", "dark"];
const LABEL = { auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" };

let mode = MODES.includes(readStore("ca_theme", "auto")) ? readStore("ca_theme", "auto") : "auto";

function apply() {
  const root = document.documentElement;
  if (mode === "auto") delete root.dataset.theme; else root.dataset.theme = mode;
  const btn = $("#themeBtn");
  btn.textContent = LABEL[mode];
  btn.setAttribute("aria-label", `Theme: ${mode}. Tap to change.`);
}

export function initTheme() {
  apply();
  $("#themeBtn").addEventListener("click", () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    writeStore("ca_theme", mode);
    apply();
  });
}
