// Review-order sheet, customer form, sending the order
import { CONFIG } from "./config.js";
import { $, money, esc, readStore, writeStore, isIOS } from "./utils.js";
import { clearCart } from "./state.js";
import { totals, updateBar } from "./cart.js";
import { controlHTML, renderList } from "./products.js";
import { postOrder } from "./api.js";

const WA_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>`;
const SMS_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>`;

const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
export const isOpen = () => $("#sheetWrap").classList.contains("open");

export function renderSheet() {
  const t = totals();
  if (!t.units) { closeSheet(); return; }
  // Keep what the customer already typed if the sheet re-draws
  const saved = $("#fShop") ? readForm() : readStore("ca_customer", {});
  $("#sheetBody").innerHTML = `
    <div class="sheet-head">
      <div><h2 id="sheetTitle">Your order</h2><p class="sub">${plural(t.lines.length, "product")}, ${plural(t.units, "unit")}</p></div>
      <button class="ghost" data-close>Keep shopping</button>
    </div>
    <div class="lines">${t.lines.map((l) => `
      <div class="line">
        <div><div class="name">${esc(l.name)}</div>
        <div class="meta">${l.price != null ? `${l.qty} × ${money(l.price)} = <span class="price">${money(l.amount)}</span>` : `${l.qty} units`}</div></div>
        ${controlHTML(l)}
      </div>`).join("")}
    </div>
    ${t.total != null ? `<div class="sum"><span>Total</span><span>${money(t.total)}</span></div>` : ""}
    <label for="fShop">Store name</label>
    <input class="field" id="fShop" autocomplete="organization" value="${esc(saved.shop || "")}">
    <label for="fName">Your name</label>
    <input class="field" id="fName" autocomplete="name" value="${esc(saved.name || "")}">
    <label for="fPhone">Phone number</label>
    <input class="field" id="fPhone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(saved.phone || "")}">
    <div class="hint">We’ll call or text this number to confirm your order.</div>
    <label for="fNote">Note (optional)</label>
    <textarea class="field" id="fNote" rows="2" placeholder="Delivery day, address change, etc.">${esc(saved.note || "")}</textarea>
    <div class="err" id="formErr" role="alert"></div>
    <p class="sends-label">Send your order by</p>
    <button class="send" data-send="whatsapp">${WA_ICON}<span>WhatsApp</span></button>
    <button class="send sms" data-send="sms">${SMS_ICON}<span>Text message</span></button>`;
}

export function openSheet() {
  renderSheet();
  $("#sheetWrap").classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeSheet() {
  $("#sheetWrap").classList.remove("open");
  document.body.style.overflow = "";
}

function buildMessage(c, t, orderId) {
  const lines = t.lines.map((l, i) =>
    `${i + 1}) ${l.name}\n   Qty ${l.qty}${l.price != null ? ` x ${money(l.price)} = ${money(l.amount)}` : ""}`);
  return [
    `*New order – ${CONFIG.BUSINESS}*` + (orderId ? ` (${orderId})` : ""),
    `Store: ${c.shop}`, `Name: ${c.name}`, `Phone: ${c.phone}`,
    c.note ? `Note: ${c.note}` : null, "",
    ...lines, "",
    t.total != null ? `*Total: ${money(t.total)}* (${t.units} units)` : `Units: ${t.units}`
  ].filter((x) => x !== null).join("\n");
}

function readForm() {
  return {
    shop: $("#fShop").value.trim(),
    name: $("#fName").value.trim(),
    phone: $("#fPhone").value.trim(),
    note: $("#fNote").value.trim()
  };
}

function validate(c) {
  if (!c.shop || !c.name) return "Enter your store name and your name.";
  if (c.phone.replace(/\D/g, "").length < 10) return "Enter a phone number with at least 10 digits.";
  return "";
}

function openMessenger(channel, msg) {
  if (channel === "sms") {
    const sep = isIOS() ? "&" : "?"; // iPhone and Android use different separators
    window.location.href = `sms:+${CONFIG.ADMIN_SMS}${sep}body=${encodeURIComponent(msg.replace(/\*/g, ""))}`;
  } else {
    window.open(`https://wa.me/${CONFIG.ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  }
}

export async function sendOrder(channel) {
  const c = readForm();
  const err = $("#formErr");
  const problem = validate(c);
  if (problem) { err.textContent = problem; return; }
  err.textContent = "";
  writeStore("ca_customer", { shop: c.shop, name: c.name, phone: c.phone });

  const t = totals();
  const btns = document.querySelectorAll("[data-send]");
  const label = document.querySelector(`[data-send="${channel}"] span`);
  const oldLabel = label.textContent;
  btns.forEach((b) => (b.disabled = true));
  label.textContent = "Sending…";

  let orderId = "";
  if (CONFIG.SAVE_TO_SHEET && CONFIG.API_URL) {
    try {
      const res = await postOrder({ customer: c, channel, items: t.lines.map((l) => ({ id: l.id, qty: l.qty })) });
      orderId = res.orderId;
    } catch (e) {
      btns.forEach((b) => (b.disabled = false));
      label.textContent = oldLabel;
      err.textContent = `The order didn’t go through: ${e.message}. Check your connection and send again.`;
      return;
    }
  } else {
    openMessenger(channel, buildMessage(c, t, orderId));
  }

  clearCart();
  renderList();
  updateBar();
  $("#sheetBody").innerHTML = `<div class="done"><div class="tick">✓</div>
    <h2 id="sheetTitle">Order sent</h2>
    <p class="sub">${orderId ? `Order ${orderId}. ` : ""}We’ll contact you at ${esc(c.phone)} to confirm.</p>
    <button class="ghost" data-close>Back to products</button></div>`;
}
