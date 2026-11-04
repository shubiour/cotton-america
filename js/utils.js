// Small helpers used everywhere
export const $ = (sel) => document.querySelector(sel);

export const money = (n) =>
  n == null ? "" : "$" + Number(n).toFixed(2).replace(/\.00$/, "");

export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Reads (M), (W) or (U) from the product name
export function genderOf(name) {
  const m = name.match(/\((M|W|U)\)/i);
  return m ? m[1].toUpperCase() : "";
}

// localStorage wrappers that never crash (private mode, full storage, etc.)
export function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
