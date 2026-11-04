// Product list: filtering, rows, quantity controls
import { CONFIG } from "./config.js";
import { $, money, esc } from "./utils.js";
import { state, findProduct } from "./state.js";

export function filtered() {
  const { gender, inStockOnly, query } = state.filters;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return state.products.filter((p) =>
    (gender === "all" || p.g === gender) &&
    (!inStockOnly || p.stock > 0) &&
    words.every((w) => p.key.includes(w))
  );
}

function stockLabel(p) {
  if (p.stock <= 0) return `<span class="stock out">Out of stock</span>`;
  if (p.stock <= CONFIG.LOW_STOCK) return `<span class="stock low">Only ${p.stock} left</span>`;
  return `<span class="stock">${p.stock} in stock</span>`;
}

// Used by both the product list and the checkout sheet
export function controlHTML(p) {
  const q = state.cart[p.id] || 0;
  if (p.stock <= 0) return `<button class="add" disabled>Add</button>`;
  if (!q) return `<button class="add" data-act="add" data-id="${p.id}">Add</button>`;
  return `<div class="step active">
    <button data-act="dec" data-id="${p.id}" aria-label="Remove one">−</button>
    <input type="number" inputmode="numeric" min="0" max="${p.stock}" value="${q}" data-id="${p.id}" aria-label="Quantity">
    <button data-act="inc" data-id="${p.id}" aria-label="Add one" ${q >= p.stock ? "disabled" : ""}>+</button>
  </div>`;
}

function rowHTML(p) {
  return `
    <div class="row ${p.stock <= 0 ? "is-out" : ""}" id="r-${p.id}">
      <div>
        <div class="name">${esc(p.name)}</div>
        <div class="meta">${p.price != null ? `<span class="price">${money(p.price)}</span>` : ""}${stockLabel(p)}</div>
      </div>
      <div class="ctl">${controlHTML(p)}</div>
    </div>`;
}

export function renderList() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / CONFIG.PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * CONFIG.PAGE_SIZE;
  const shown = list.slice(start, start + CONFIG.PAGE_SIZE);

  $("#count").textContent = list.length > shown.length
    ? `Showing ${start + 1}–${start + shown.length} of ${list.length} (${state.products.length} total)`
    : `${list.length} of ${state.products.length} products`;
  renderPager(pages);

  if (!list.length) {
    $("#list").innerHTML = `<div class="empty">No products match “${esc(state.filters.query)}”. Try a shorter word, like the brand name.</div>`;
    return;
  }
  $("#list").innerHTML = shown.map(rowHTML).join("");
}

function renderPager(pages) {
  const p = state.page;
  $("#pager").innerHTML = pages <= 1 ? "" : `
    <button class="ghost" data-page="${p - 1}" ${p <= 1 ? "disabled" : ""}>‹ Prev</button>
    <span>Page ${p} of ${pages}</span>
    <button class="ghost" data-page="${p + 1}" ${p >= pages ? "disabled" : ""}>Next ›</button>`;
}

export function goToPage(n) {
  state.page = n;
  renderList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Re-draw just one row's +/- control (fast, keeps scroll position)
export function refreshRow(id) {
  const p = findProduct(id);
  const row = document.getElementById("r-" + id);
  if (p && row) row.querySelector(".ctl").innerHTML = controlHTML(p);
}

export function showLoadError(retry) {
  $("#list").innerHTML = `<div class="error">Products couldn’t load. Check your internet connection and try again.<br><button class="ghost" id="retryLoad">Try again</button></div>`;
  $("#retryLoad").addEventListener("click", retry);
}
