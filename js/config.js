// ===================== SETTINGS – edit these =====================
export const CONFIG = {
  // Step 1 Apps Script Web app URL. Leave "" to preview with demo data.
  API_URL: "https://script.google.com/macros/s/AKfycbzXJcq_TTgY1m5A4eG7C-7_EZFPazsF-J3N1ohzXYEGcYDNnGVA2fO2OAHkgBQNgOGvFw/exec",

  // Admin numbers: country code + number, digits only
  ADMIN_WHATSAPP: "17867291938",
  ADMIN_SMS: "17867291938",

  // Later step: save orders to the sheet + auto-alert admins
  SAVE_TO_SHEET: false,

  // Show "Only X left" at or below this stock
  LOW_STOCK: 5,

  // Products shown per page
  PAGE_SIZE: 50,

  BUSINESS: "Cotton America"
};
