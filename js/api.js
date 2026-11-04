// Talks to the Google Apps Script Web app
import { CONFIG } from "./config.js";
import { DEMO } from "./demo-data.js";

export async function fetchProducts() {
  if (!CONFIG.API_URL) return { products: DEMO, live: false };
  const r = await fetch(CONFIG.API_URL, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const data = await r.json();
  return { products: data.products, live: true };
}

export async function postOrder(order) {
  const r = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
    body: JSON.stringify(order)
  });
  const res = await r.json();
  if (!res.ok) throw new Error(res.error || "Order failed");
  return res; // { ok: true, orderId }
}
