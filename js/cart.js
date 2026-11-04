// Cart logic + the sticky order bar
import { $, money } from "./utils.js";
import { state, findProduct, saveCart } from "./state.js";

export function setQty(id, qty) {
  const p = findProduct(id);
  if (!p) return;
  const q = Math.max(0, Math.min(p.stock, Math.floor(Number(qty) || 0)));
  if (q) state.cart[id] = q; else delete state.cart[id];
  saveCart();
  updateBar(true);
  // Let the product list and checkout sheet refresh themselves
  document.dispatchEvent(new CustomEvent("cart:change", { detail: { id } }));
}

export function cartLines() {
  return Object.entries(state.cart)
    .map(([id, qty]) => {
      const p = findProduct(id);
      return p ? { ...p, qty, amount: p.price != null ? p.price * qty : null } : null;
    })
    .filter(Boolean);
}

export function totals() {
  const lines = cartLines();
  return {
    lines,
    units: lines.reduce((a, l) => a + l.qty, 0),
    total: lines.some((l) => l.price != null) ? lines.reduce((a, l) => a + (l.amount || 0), 0) : null
  };
}

export function updateBar(bump = false) {
  const t = totals();
  $("#orderbar").classList.toggle("show", t.units > 0);
  $("#barQty").textContent = t.units;
  $("#barTotal").textContent = t.total != null ? money(t.total) : "";
  $("#openCart").setAttribute("aria-label", `Review order, ${t.units} units`);
  if (bump) {
    const b = $("#barQty");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
}
