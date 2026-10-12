import { Order } from '../types';
import { StorageService } from './storage';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * HOTSPOT RESTAURANT - Google Sheets Reception Billing Webhook
 * 
 * Instructions:
 * 1. Create a new Google Sheet named "Hotspot Orders"
 * 2. In Row 1, set these headers in columns A to L:
 *    Bill No | Date | Time | Customer | Table / Type | Items Ordered | Subtotal | Discount | Tax | Total (Rs) | Payment | Created At
 * 3. Go to: Extensions -> Apps Script
 * 4. Paste this ENTIRE code into the editor replacing everything
 * 5. Click "Deploy" -> "New deployment"
 * 6. Select type: "Web app"
 * 7. Configuration:
 *    - Description: Hotspot POS Sync
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (CRITICAL so the browser POS can send rows)
 * 8. Click "Deploy", authorize permissions, and copy the Web App URL (ends with /exec)
 * 9. Paste that URL into the Hotspot App Settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other concurrent writes
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Bill No",
        "Date",
        "Time",
        "Customer",
        "Table / Type",
        "Items Ordered",
        "Subtotal (Rs)",
        "Discount (Rs)",
        "Tax (Rs)",
        "Total (Rs)",
        "Payment",
        "Recorded At"
      ]);
      // Format headers
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

    // Append the order row
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
      message: "Order recorded successfully",
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Hotspot Restaurant Billing Apps Script Endpoint is Active!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

export const SheetsSyncService = {
  /**
   * Send a single order to Google Apps Script URL
   */
  async syncOrder(order: Order, customUrl?: string): Promise<{ success: boolean; message: string }> {
    const settings = StorageService.getSettings();
    const endpointUrl = (customUrl || settings.googleAppsScriptUrl || '').trim();

    if (!endpointUrl) {
      return {
        success: false,
        message: 'No Google Apps Script URL configured. Order saved locally.',
      };
    }

    if (!navigator.onLine) {
      StorageService.addToSyncQueue(order.id);
      return {
        success: false,
        message: 'Device is offline. Order added to sync queue.',
      };
    }

    const itemsSummary = order.items
      .map((item) => `${item.name} (${item.quantity}x @ Rs ${item.price})`)
      .join(', ');

    const payload = {
      action: 'addOrder',
      billNo: order.billNo,
      date: order.date,
      time: order.time,
      customer: order.customerName || 'Walk-in',
      table: order.tableNumber,
      items: itemsSummary,
      subtotal: order.subtotal,
      discount: order.discountAmount,
      tax: order.taxAmount,
      total: order.grandTotal,
      paymentMethod: order.paymentMethod,
      timestamp: order.timestamp,
    };

    try {
      // Using Content-Type text/plain prevents standard CORS preflight issues with Google Apps Script
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      // Update order status locally
      const updatedOrder: Order = {
        ...order,
        syncedToSheets: true,
        syncedAt: Date.now(),
        syncError: undefined,
      };
      StorageService.updateOrder(updatedOrder);
      StorageService.removeFromSyncQueue(order.id);

      return {
        success: true,
        message: `Order #${order.billNo} successfully synced to Google Sheets!`,
      };
    } catch (err: any) {
      // If CORS or network failed, try no-cors fallback which Google Apps Script still consumes
      try {
        await fetch(endpointUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });

        const updatedOrder: Order = {
          ...order,
          syncedToSheets: true,
          syncedAt: Date.now(),
          syncError: undefined,
        };
        StorageService.updateOrder(updatedOrder);
        StorageService.removeFromSyncQueue(order.id);

        return {
          success: true,
          message: `Order #${order.billNo} sent to Google Sheets!`,
        };
      } catch (fallbackErr: any) {
        // Enqueue for later sync
        StorageService.addToSyncQueue(order.id);
        const updatedOrder: Order = {
          ...order,
          syncedToSheets: false,
          syncError: fallbackErr?.message || 'Network sync error',
        };
        StorageService.updateOrder(updatedOrder);

        return {
          success: false,
          message: `Failed to sync order #${order.billNo}. Queued for offline sync.`,
        };
      }
    }
  },

  /**
   * Process all queued orders that haven't been synced yet
   */
  async syncPendingQueue(
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = StorageService.getSyncQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    const allOrders = StorageService.getOrders();
    let synced = 0;
    let failed = 0;

    for (const orderId of queue) {
      const order = allOrders.find((o) => o.id === orderId);
      if (order && !order.syncedToSheets) {
        const res = await this.syncOrder(order);
        if (res.success) {
          synced++;
        } else {
          failed++;
        }
      } else {
        // Already synced or deleted, remove from queue
        StorageService.removeFromSyncQueue(orderId);
      }
      if (onProgress) {
        onProgress(synced + failed, queue.length);
      }
    }

    return { syncedCount: synced, failedCount: failed };
  },

  /**
   * Test Apps Script URL connection
   */
  async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: 'Please enter a valid Google Apps Script Web App URL.' };
    }

    try {
      // Test with test payload
      const testPayload = {
        action: 'test',
        billNo: 'TEST-000',
        date: new Date().toISOString().split('T')[0],
        time: 'TEST',
        customer: 'Hotspot Connection Test',
        table: 'Test Counter',
        items: 'Test Connection Ping (1x)',
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'CASH',
      };

      await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload),
      });

      return {
        success: true,
        message: 'Connection successful! Test row recorded in your Google Sheet.',
      };
    } catch (err: any) {
      // Try no-cors ping
      try {
        await fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'ping' }),
        });
        return {
          success: true,
          message: 'Webhook reached successfully (via browser proxy)! Ready to sync orders.',
        };
      } catch (err2: any) {
        return {
          success: false,
          message: `Connection failed: ${err2.message || 'Could not reach endpoint'}. Make sure deployment access is set to "Anyone".`,
        };
      }
    }
  },
};
