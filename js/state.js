// Shared app state. Other modules read/write it through these functions.
import { readStore, writeStore, genderOf } from "./utils.js";

export const state = {
  products: [],
  cart: readStore("ca_cart", {}),   // { productId: qty }
  filters: { gender: "all", inStockOnly: false, query: "" }
};

export function setProducts(list) {
  state.products = list.map((p) => ({ ...p, g: genderOf(p.name), key: p.name.toLowerCase() }));
  // Remove cart items that no longer exist and cap at current stock
  const byId = Object.fromEntries(state.products.map((p) => [p.id, p]));
  for (const id in state.cart) {
    const p = byId[id];
    const q = p ? Math.min(state.cart[id], p.stock) : 0;
    if (q > 0) state.cart[id] = q; else delete state.cart[id];
  }
  saveCart();
}

export const findProduct = (id) => state.products.find((p) => p.id === id);

export function saveCart() { writeStore("ca_cart", state.cart); }

export function clearCart() { state.cart = {}; saveCart(); }
