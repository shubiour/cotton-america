/**
 * Cotton America – B2B Ordering Site API (Step 1: product list)
 * Paste into: Google Sheet > Extensions > Apps Script > Code.gs
 * It only READS the sheet. It never changes your AppSheet data.
 */

// ---------- SETTINGS ----------
const SHOW_PRICES = true;          // false = hide Selling Rate from customers
const HIDE_OUT_OF_STOCK = false;   // true = don't show items with 0 stock
const CACHE_SECONDS = 60;          // how long the product list is cached
// Invoices with these statuses do NOT reduce stock (change to match your AppSheet formula)
const STATUSES_NOT_COUNTED = ['Draft'];
// Items that are not real perfumes
const HIDDEN_ITEMS = ['DUE BILL ON LAST MEMO'];
// ------------------------------

function doGet(e) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('products');
  if (cached) return json_(cached);

  const body = JSON.stringify({ updated: new Date().toISOString(), products: getProducts_() });
  if (body.length < 95000) cache.put('products', body, CACHE_SECONDS); // cache limit ~100KB
  return json_(body);
}

function getProducts_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const products = readTable_(ss, 'Products');
  const invoices = readTable_(ss, 'Invoices');
  const items = readTable_(ss, 'Invoice Items');

  // Invoice ID -> Status
  const invStatus = {};
  invoices.forEach(r => { if (r['Invoice ID']) invStatus[r['Invoice ID']] = String(r['Status'] || '').trim(); });

  // Product ID -> qty sold
  const sold = {};
  items.forEach(r => {
    const pid = r['Product ID'];
    if (!pid) return;
    const status = invStatus[r['Invoice ID']];
    if (status === undefined || STATUSES_NOT_COUNTED.includes(status)) return;
    sold[pid] = (sold[pid] || 0) + (Number(r['Qty']) || 0);
  });

  const out = [];
  products.forEach(p => {
    const id = p['Product ID'];
    const name = String(p['Item Name'] || '').trim();
    if (!id || !name) return;
    if (String(p['Status'] || '').trim().toLowerCase() === 'inactive') return;
    if (HIDDEN_ITEMS.includes(name.toUpperCase())) return;

    const stock = (Number(p['Opening Stock']) || 0) - (sold[id] || 0);
    if (HIDE_OUT_OF_STOCK && stock <= 0) return;

    const item = { id: id, name: name, stock: Math.max(stock, 0) };
    if (SHOW_PRICES) item.price = Number(p['Selling Rate']) || null;
    // NOTE: Buying Rate, Barcode, Description are never sent to customers
    out.push(item);
  });

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// Reads a tab into objects keyed by header name (column order doesn't matter)
function readTable_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing tab: ' + sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values.shift().map(h => String(h).trim());
  return values.map(row => {
    const o = {};
    headers.forEach((h, i) => o[h] = row[i]);
    return o;
  });
}

function json_(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor to test and approve permissions
function testProducts() {
  const list = getProducts_();
  Logger.log(list.length + ' products');
  Logger.log(JSON.stringify(list.slice(0, 5), null, 2));
}
