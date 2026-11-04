// Entry point: loads products and wires up all clicks and inputs
import { $ } from "./utils.js";
import { state, setProducts } from "./state.js";
import { fetchProducts } from "./api.js";
import { renderList, refreshRow, showLoadError, showLoading, goToPage, openPhoto } from "./products.js";
import { setQty, updateBar } from "./cart.js";
import { initTheme } from "./theme.js";
import { openSheet, closeSheet, renderSheet, sendOrder, isOpen } from "./checkout.js";

async function load() {
  showLoading();
  try {
    const { products, live } = await fetchProducts();
    setProducts(products);
    $("#updated").textContent = live ? "Live stock" : "Demo data";
    renderList();
    updateBar();
  } catch (e) {
    console.error(e);
    showLoadError(load);
  }
}

// One click handler for the whole page
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const id = b.dataset.id;
  const q = state.cart[id] || 0;

  if (b.dataset.photo) openPhoto(b.dataset.pid);
  else if (b.id === "photoClose") $("#photoView").close();
  else if (b.dataset.act === "add") setQty(id, 1);
  else if (b.dataset.act === "inc") setQty(id, q + 1);
  else if (b.dataset.act === "dec") setQty(id, q - 1);
  else if (b.dataset.page) goToPage(Number(b.dataset.page));
  else if (b.dataset.g) {
    state.filters.gender = b.dataset.g;
    state.page = 1;
    document.querySelectorAll("[data-g]").forEach((c) => c.setAttribute("aria-pressed", c === b));
    renderList();
  }
  else if (b.id === "instock") {
    state.filters.inStockOnly = !state.filters.inStockOnly;
    state.page = 1;
    b.setAttribute("aria-pressed", state.filters.inStockOnly);
    renderList();
  }
  else if (b.id === "openCart") openSheet();
  else if ("close" in b.dataset) closeSheet();
  else if (b.dataset.send) sendOrder(b.dataset.send);
});

// Typing a quantity directly
document.addEventListener("change", (e) => {
  if (e.target.matches(".step input")) setQty(e.target.dataset.id, e.target.value);
});

// When the cart changes, refresh that product row and the open sheet
document.addEventListener("cart:change", (e) => {
  refreshRow(e.detail.id);
  if (isOpen()) renderSheet();
});

$("#sheetBg").addEventListener("click", closeSheet);
// Tap outside the photo to close it
$("#photoView").addEventListener("click", (e) => { if (e.target.id === "photoView") e.target.close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

let timer;
$("#q").addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => { state.filters.query = e.target.value; state.page = 1; renderList(); }, 120);
});

initTheme();
load();
