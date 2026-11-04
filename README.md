# Cotton America – Wholesale Ordering Site

Mobile ordering site for Cotton America clients. Stock comes live from the
same Google Sheet used by the AppSheet inventory/invoice app.

## Files
```
index.html          Page structure
css/styles.css      All styling (colors at the top in :root)
js/config.js        SETTINGS: API URL, admin WhatsApp/SMS numbers
js/app.js           Entry point, wires up clicks and search
js/api.js           Talks to the Google Apps Script Web app
js/state.js         Products, cart, filters
js/products.js      Product list and +/- controls
js/cart.js          Cart totals and the bottom order bar
js/checkout.js      Review sheet, customer form, WhatsApp/SMS sending
js/demo-data.js     Sample products (used only when API_URL is empty)
apps-script/Code.gs Paste into the Sheet: Extensions > Apps Script
```

## Setup
1. Deploy `apps-script/Code.gs` as a Web app (Execute as: Me, Access: Anyone).
2. Paste the Web app URL into `API_URL` in `js/config.js`.
3. Push to GitHub, then Settings > Pages > Deploy from branch `main`, folder `/ (root)`.

## Test locally
The site uses JavaScript modules, so double-clicking index.html won't work.
Use VS Code's "Live Server" extension, or run `npx serve` in this folder.

Note: the `apps-script` folder is not used by the website. It's kept here so
the backend code is versioned with the site.
