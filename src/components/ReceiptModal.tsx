import React, { useState } from 'react';
import { Order, RestaurantSettings, PrinterFormat } from '../types';
import { 
  Printer, 
  Download, 
  X, 
  Flame, 
  CheckCircle2, 
  Clock, 
  FileText,
  ExternalLink,
  Laptop,
  HelpCircle
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  settings: RestaurantSettings;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  isOpen,
  onClose,
  onNewOrder,
}) => {
  const [printFormat, setPrintFormat] = useState<PrinterFormat>(settings.defaultPrinterType || 'thermal-80mm');
  const [showLaptopGuide, setShowLaptopGuide] = useState(false);

  if (!isOpen || !order) return null;

  const isThermal = printFormat === 'thermal-80mm';

  const getReceiptHtml = () => {
    return `
      <div style="text-align: center; padding-bottom: 8px; border-bottom: 1px dashed #444;">
        <div style="font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">🔥 ${settings.restaurantName || 'HOTSPOT'} 🔥</div>
        <div style="font-size: 11px; margin-top: 2px;">${settings.tagline || 'Sizzling Flavours & Gourmet Grills'}</div>
        <div style="font-size: 10px; margin-top: 2px; color: #333;">${settings.address || ''}</div>
        <div style="font-size: 10px; color: #333;">Ph: ${settings.phone1 || ''} ${settings.phone2 ? '| ' + settings.phone2 : ''}</div>
        ${settings.ntnNumber ? `<div style="font-size: 10px; font-family: monospace;">NTN: ${settings.ntnNumber}</div>` : ''}
      </div>

      <div style="padding: 8px 0; border-bottom: 1px dashed #444; font-size: 11px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>BILL NO: #${order.billNo}</span>
          <span style="text-transform: uppercase;">${order.tableNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #333;">
          <span>Date: ${order.date}</span>
          <span>Time: ${order.time}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #333;">
          <span>Customer: ${order.customerName || 'Walk-in'}</span>
          <span>Type: ${(order.orderType || 'dine-in').toUpperCase()}</span>
        </div>
      </div>

      <div style="padding: 8px 0; border-bottom: 1px dashed #444;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px solid #444; text-align: left; font-weight: bold; text-transform: uppercase;">
              <th style="padding: 4px 0;">Item</th>
              <th style="padding: 4px 0; text-align: center; width: 35px;">Qty</th>
              <th style="padding: 4px 0; text-align: right; width: 55px;">Price</th>
              <th style="padding: 4px 0; text-align: right; width: 65px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (i) => `
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">${i.name}</td>
                <td style="padding: 4px 0; text-align: center;">${i.quantity}</td>
                <td style="padding: 4px 0; text-align: right;">${i.price}</td>
                <td style="padding: 4px 0; text-align: right; font-weight: bold;">${(i.price * i.quantity).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div style="padding: 8px 0; border-bottom: 1px dashed #444; font-size: 11px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span style="font-weight: 600;">${settings.currencySymbol} ${order.subtotal.toLocaleString()}</span>
        </div>
        ${
          order.discountAmount > 0
            ? `
          <div style="display: flex; justify-content: space-between; color: #047857;">
            <span>Discount (${order.discountType === 'percent' ? order.discountValue + '%' : 'Flat'}):</span>
            <span>-${settings.currencySymbol} ${order.discountAmount.toLocaleString()}</span>
          </div>
        `
            : ''
        }
        <div style="display: flex; justify-content: space-between;">
          <span>Sales Tax (${order.taxRate}%):</span>
          <span style="font-weight: 600;">${settings.currencySymbol} ${order.taxAmount.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding-top: 6px; border-top: 1px solid #444; margin-top: 4px;">
          <span>NET PAYABLE:</span>
          <span>${settings.currencySymbol} ${order.grandTotal.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-top: 4px;">
          <span>Payment: ${(order.paymentMethod || 'cash').toUpperCase()}</span>
          ${
            order.amountPaid > 0
              ? `<span>Tendered: ${settings.currencySymbol} ${order.amountPaid} | Change: ${settings.currencySymbol} ${order.changeGiven}</span>`
              : ''
          }
        </div>
      </div>

      <div style="padding-top: 10px; text-align: center; font-size: 11px;">
        <div style="font-weight: bold; text-transform: uppercase;">${settings.footerText || 'Thank you for visiting Hotspot!'}</div>
        <div style="font-size: 10px; color: #555; margin-top: 3px;">Hotspot Counter POS Billing System</div>
        <div style="font-size: 9px; color: #888; margin-top: 4px;">*** HAVE A DELICIOUS & SPICY DAY ***</div>
      </div>
    `;
  };

  // Fail-Safe Print Engine
  const handlePrint = () => {
    const receiptHtml = getReceiptHtml();
    
    // 1. Try hidden iframe printing (Cleanest standard for POS)
    try {
      let printFrame = document.getElementById('pos-print-iframe') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'pos-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }

      const doc = printFrame.contentWindow?.document;
      if (doc) {
        const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">`;
        const styles = `
          @page {
            margin: 0;
            size: ${isThermal ? '78mm auto' : 'A4'};
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: ${isThermal ? "'JetBrains Mono', 'Courier New', monospace" : "'Plus Jakarta Sans', Arial, sans-serif"};
            color: #000000 !important;
            background: #ffffff !important;
            padding: ${isThermal ? '3mm 4mm' : '12mm 15mm'};
            width: ${isThermal ? '76mm' : '100%'};
            margin: 0 auto;
            font-size: ${isThermal ? '11px' : '13px'};
            line-height: 1.35;
          }
        `;

        doc.open();
        doc.write(`<!DOCTYPE html><html><head><title>Receipt #${order.billNo}</title>${fontLink}<style>${styles}</style></head><body>${receiptHtml}</body></html>`);
        doc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch {
            window.print();
          }
        }, 200);
        return;
      }
    } catch {
      // Fallback
    }

    // 2. Direct Window Print fallback
    window.print();
  };

  // Open in Separate Printable Tab
  const handleOpenPrintTab = () => {
    const receiptHtml = getReceiptHtml();
    const styles = `
      @page { margin: 0; size: ${isThermal ? '78mm auto' : 'A4'}; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: ${isThermal ? "'Courier New', Courier, monospace" : "'Segoe UI', Roboto, sans-serif"};
        color: #000;
        background: #fff;
        padding: ${isThermal ? '5mm' : '15mm'};
        width: ${isThermal ? '76mm' : '180mm'};
        margin: 0 auto;
        font-size: ${isThermal ? '11px' : '13px'};
        line-height: 1.3;
      }
      .no-print { text-align: center; margin-bottom: 15px; }
      @media print { .no-print { display: none; } }
    `;

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Receipt #${order.billNo} - Hotspot</title>
  <style>${styles}</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; background: #ea580c; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-size: 14px;">
      🖨️ Click Here to Print Receipt
    </button>
  </div>
  ${receiptHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Download Standalone Receipt
  const handleDownloadHtml = () => {
    const receiptHtml = getReceiptHtml();
    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hotspot_Receipt_${order.billNo}</title>
  <style>
    body {
      font-family: ${isThermal ? "'Courier New', monospace" : "sans-serif"};
      padding: 20px;
      margin: 0 auto;
      max-width: ${isThermal ? '320px' : '700px'};
      color: #000;
      background: #fff;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${receiptHtml}
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hotspot_Receipt_${order.billNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh]">
        {/* Top Modal Controls */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/80 dark:bg-stone-900/80">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Receipt Generated</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono-numbers">
                #{order.billNo}
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">Ready to print on 80mm thermal or A4</p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Format selector */}
            <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal-80mm')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'thermal-80mm'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                A4
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printer helper alert banner */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>پرنٹنگ ٹپ: اگر براہ راست پرنٹ نہ ہو تو &quot;Open Print Tab&quot; استعمال کریں۔</span>
          </span>
          <button
            type="button"
            onClick={() => setShowLaptopGuide(!showLaptopGuide)}
            className="text-[11px] font-bold underline cursor-pointer hover:text-amber-900 dark:hover:text-amber-200 whitespace-nowrap"
          >
            دوسرے لیپ ٹاپ پر گائیڈ
          </button>
        </div>

        {/* Laptop Setup Guide Dropdown */}
        {showLaptopGuide && (
          <div className="p-4 bg-stone-50 dark:bg-stone-800/90 border-b border-stone-200 dark:border-stone-700 text-xs space-y-2 text-stone-700 dark:text-stone-300 animate-fade-in">
            <div className="flex items-center justify-between font-bold text-stone-900 dark:text-white">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-amber-500" />
                <span>کسی بھی دوسرے لیپ ٹاپ پر یہ ایپ کیسے چلائیں؟</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLaptopGuide(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
              <li>
                <strong>براؤزر میں لنک کھولیں:</strong> دوسرے لیپ ٹاپ کے گوگل کروم یا ایج براؤزر میں اوپر کا لنک (یا App URL) کھولیں۔
              </li>
              <li>
                <strong>بغیر انسٹالیشن چلے گا:</strong> یہ ویب ایپلیکیشن بغیر کسی سافٹ ویئر انسٹالیشن کے ہر لیپ ٹاپ (Windows, Mac, Linux) پر چلتی ہے۔
              </li>
              <li>
                <strong>آف لائن کام:</strong> انٹرنیٹ نہ ہو تب بھی کاؤنٹر پر بل بنتے رہیں گے۔
              </li>
              <li>
                <strong>تھرمل پرنٹر کی ترتیبات:</strong> پرنٹ کرتے وقت &quot;Destination&quot; میں اپنا 80mm پرنٹر منتخب کریں اور &quot;Margins: None&quot; رکھیں۔
              </li>
            </ol>
          </div>
        )}

        {/* Receipt Container Preview (And the actual DOM printed) */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 dark:bg-stone-950/60 flex justify-center">
          <div
            id="printable-receipt-root"
            className={`bg-white text-stone-950 shadow-md border border-stone-200 transition-all ${
              isThermal
                ? 'receipt-thermal w-[340px] p-5 font-mono text-[12px] leading-relaxed'
                : 'receipt-a4 w-[420px] p-8 font-sans text-[13px] leading-relaxed'
            }`}
          >
            {/* Header: Flame Logo & Name */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <div className="inline-flex items-center justify-center gap-1.5 mb-1">
                <Flame className="w-6 h-6 text-orange-600 fill-orange-600 inline" />
                <span className="text-2xl font-extrabold tracking-wider text-stone-900 uppercase font-sans">
                  {settings.restaurantName || 'HOTSPOT'}
                </span>
                <Flame className="w-6 h-6 text-orange-600 fill-orange-600 inline" />
              </div>
              <p className="text-[11px] text-stone-600 font-sans">{settings.tagline}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">{settings.address}</p>
              <p className="text-[10px] text-stone-500">
                Ph: {settings.phone1} {settings.phone2 ? `| ${settings.phone2}` : ''}
              </p>
              {settings.ntnNumber && (
                <p className="text-[10px] text-stone-400 font-mono">NTN: {settings.ntnNumber}</p>
              )}
            </div>

            {/* Bill Details Strip */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between items-center font-bold">
                <span>BILL NO: #{order.billNo}</span>
                <span className="uppercase px-1.5 py-0.5 bg-stone-100 rounded text-[10px]">
                  {order.tableNumber}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Date: {order.date}</span>
                <span>Time: {order.time}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Customer: {order.customerName || 'Walk-in Guest'}</span>
                <span>Type: {order.orderType.toUpperCase()}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-stone-300">
              <div className="flex justify-between text-[11px] font-bold text-stone-800 pb-1 border-b border-stone-200 mb-1.5 uppercase">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-16 text-right">Total</span>
              </div>

              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-1">
                      <span className="font-semibold text-stone-900">{item.name}</span>
                    </div>
                    <span className="w-8 text-center font-mono">{item.quantity}</span>
                    <span className="w-16 text-right font-mono text-stone-600">{item.price}</span>
                    <span className="w-16 text-right font-mono font-bold text-stone-900">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol} {order.subtotal.toLocaleString()}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Discount ({order.discountType === 'percent' ? `${order.discountValue}%` : 'Flat'}):
                  </span>
                  <span>-{settings.currencySymbol} {order.discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Sales Tax ({order.taxRate}%):</span>
                <span>{settings.currencySymbol} {order.taxAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-[14px] font-extrabold text-stone-900 pt-1.5 border-t border-stone-300">
                <span>NET PAYABLE:</span>
                <span>{settings.currencySymbol} {order.grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-[10px] text-stone-600 pt-1">
                <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                {order.amountPaid > 0 && (
                  <span>
                    Tendered: {settings.currencySymbol} {order.amountPaid} | Change: {settings.currencySymbol} {order.changeGiven}
                  </span>
                )}
              </div>
            </div>

            {/* Footer Thank You */}
            <div className="pt-3 text-center space-y-1">
              <p className="text-[11px] font-bold text-stone-800 uppercase tracking-wider font-sans">
                {settings.footerText || 'Thank you for visiting Hotspot!'}
              </p>
              <p className="text-[10px] text-stone-500">
                Hotspot Reception Billing Counter
              </p>
              <div className="text-[9px] text-stone-400 font-mono pt-1">
                * * * HAVE A SPICY & FLAVORFUL DAY * * *
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-2.5">
          {/* Sync status info */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            {order.syncedToSheets ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sheets Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Local Saved</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
              title="Save HTML / PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>

            {/* Open in Dedicated Print Tab */}
            <button
              type="button"
              onClick={handleOpenPrintTab}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
              title="Open standalone print window in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Print Tab</span>
            </button>

            {/* Main Print Trigger */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={onNewOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl transition-colors cursor-pointer"
            >
              <span>Next Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
