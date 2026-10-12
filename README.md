# Hotspot - Restaurant Reception Billing Web App

A modern, fast, touch-friendly counter billing and reception POS web application custom-designed for **Hotspot** restaurant. Runs in any modern web browser on laptops, desktops, or tablets (Windows, macOS, Linux) with 100% offline functionality.

---

## 🚀 How to Run on Any Laptop or Desktop

### Option 1: Standalone Browser Use (No Installation Needed)
1. Open this project directory in your browser, or double-click `index.html` (or run a lightweight static local server).
2. For development or local hosting:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in Google Chrome, Microsoft Edge, Safari, or Firefox.

### Offline Capability
- The app stores all menu items, prices, order history, and settings locally in the browser's `localStorage`.
- It works smoothly even when the restaurant's internet is completely disconnected.
- Offline bills are automatically queued and synchronized once connectivity resumes.

---

## 🔒 Security PINs (Default Access)

- **Receptionist / Cashier PIN**: `1234` (Unlocks the counter when locked)
- **Admin PIN**: `9999` (Unlocks Menu Management, Settings & Financial parameters)
- *Both PINs can be customized anytime from the **Menu & Settings -> Restaurant & Billing Settings** tab.*

---

## 📊 How to Set Up Google Sheets Live Sync (5 Minutes)

Every time a receipt is generated, Hotspot automatically pushes the bill details to your Google Sheet as a new row.

### Step 1: Create Your Google Sheet
1. Go to [Google Sheets](https://sheets.new) and create a new spreadsheet named **"Hotspot Orders"**.
2. Name the first tab/sheet `Orders`.

### Step 2: Add the Apps Script Code
1. In your Google Sheet, click **Extensions** in the top menu -> **Apps Script**.
2. Delete any boilerplate code inside `Code.gs`.
3. Copy and paste the script below into `Code.gs`:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Bill No", "Date", "Time", "Customer", "Table / Type", 
        "Items Ordered", "Subtotal (Rs)", "Discount (Rs)", "Tax (Rs)", 
        "Total (Rs)", "Payment", "Recorded At"
      ]);
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#ea580c");
      headerRange.setFontColor("#ffffff");
    }

    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    sheet.appendRow([
      data.billNo || "",
      data.date || "",
      data.time || "",
      data.customer || "Walk-in",
      data.table || "Takeaway",
      data.items || "",
      Number(data.subtotal) || 0,
      Number(data.discount) || 0,
      Number(data.tax) || 0,
      Number(data.total) || 0,
      (data.paymentMethod || "CASH").toUpperCase(),
      new Date().toLocaleString()
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      billNo: data.billNo
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
```

### Step 3: Deploy as a Web App
1. Click the blue **Deploy** button (top right) -> **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the fields:
   - **Description**: `Hotspot POS Sync`
   - **Execute as**: `Me (your google account)`
   - **Who has access**: `Anyone` *(Crucial so the browser can send order rows)*
4. Click **Deploy**. Authorize Google permissions if prompted.
5. Copy the **Web app URL** (ends in `/exec`).

### Step 4: Paste into Hotspot App
1. In the Hotspot web app, go to **Menu & Settings** (Enter Admin PIN `9999`).
2. Click the **Google Sheets Webhook** tab.
3. Paste your Web App URL into the field.
4. Click **Test Connection**. You will see a test row appear immediately in your Google Sheet!

---

## ⌨️ Fast Counter Keyboard Shortcuts

- **F2**: Jump directly to the food search box
- **F9**: Generate receipt & open print preview
- **Ctrl + P**: Print receipt
- **Esc**: Close open receipt / dialogs

---

## 🖨️ Receipt Printing
- **80mm Thermal Receipt**: Formatted for standard EPSON, Xprinter, Rongta, and generic 80mm ESC/POS USB & Network roll receipt printers.
- **A4 Format**: Clean standard invoice for corporate or catering accounts.
- **Save File**: Download as HTML/PDF receipt.
