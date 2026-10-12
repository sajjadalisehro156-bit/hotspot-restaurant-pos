import { MenuItem, Order, RestaurantSettings } from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  MENU_ITEMS: 'hotspot_pos_menu_items_v1',
  CATEGORIES: 'hotspot_pos_categories_v1',
  SETTINGS: 'hotspot_pos_settings_v1',
  ORDERS: 'hotspot_pos_orders_v1',
  ORDER_COUNTER: 'hotspot_pos_order_counter_v1',
  SYNC_QUEUE: 'hotspot_pos_sync_queue_v1',
};

// Safe parse helper
function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error parsing localStorage key: ${key}`, err);
    return fallback;
  }
}

export const StorageService = {
  // Menu items
  getMenuItems(): MenuItem[] {
    const items = safeJsonParse<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, []);
    if (!items || items.length === 0) {
      this.saveMenuItems(INITIAL_MENU_ITEMS);
      return INITIAL_MENU_ITEMS;
    }
    return items;
  },

  saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  },

  // Categories
  getCategories(): string[] {
    const categories = safeJsonParse<string[]>(STORAGE_KEYS.CATEGORIES, []);
    if (!categories || categories.length === 0) {
      this.saveCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    return categories;
  },

  saveCategories(categories: string[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Settings
  getSettings(): RestaurantSettings {
    const settings = safeJsonParse<RestaurantSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    // ensure merge with any new fields
    return { ...INITIAL_SETTINGS, ...settings };
  },

  saveSettings(settings: RestaurantSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Orders
  getOrders(): Order[] {
    return safeJsonParse<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  saveOrder(order: Order): Order {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return order;
  },

  updateOrder(updatedOrder: Order): void {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === updatedOrder.id);
    if (idx !== -1) {
      orders[idx] = updatedOrder;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  getNextBillNumber(): { billNo: string; orderNumber: number } {
    let currentCount = safeJsonParse<number>(STORAGE_KEYS.ORDER_COUNTER, 0);
    // If there are existing orders, verify counter is at least max order number
    const orders = this.getOrders();
    if (orders.length > 0 && currentCount === 0) {
      currentCount = Math.max(...orders.map((o) => o.orderNumber || 0));
    }
    const nextNumber = currentCount + 1;
    localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, JSON.stringify(nextNumber));
    const padded = String(nextNumber).padStart(4, '0');
    return {
      billNo: padded,
      orderNumber: nextNumber,
    };
  },

  // Offline Sync Queue for Google Sheets
  getSyncQueue(): string[] {
    return safeJsonParse<string[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  addToSyncQueue(orderId: string): void {
    const queue = this.getSyncQueue();
    if (!queue.includes(orderId)) {
      queue.push(orderId);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  },

  removeFromSyncQueue(orderId: string): void {
    const queue = this.getSyncQueue().filter((id) => id !== orderId);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  // CSV Export for Orders
  exportOrdersToCSV(ordersToExport?: Order[]): void {
    const orders = ordersToExport || this.getOrders();
    if (orders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = [
      'Bill Number',
      'Date',
      'Time',
      'Order Type',
      'Table',
      'Customer Name',
      'Items Summary',
      'Total Items Count',
      'Subtotal (Rs)',
      'Discount (Rs)',
      'Tax (Rs)',
      'Grand Total (Rs)',
      'Payment Method',
      'Google Sheets Synced',
    ];

    const escapeCsv = (str: string | number) => {
      const s = String(str ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = orders.map((o) => {
      const itemsSummary = o.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
      const totalItemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);

      return [
        escapeCsv(o.billNo),
        escapeCsv(o.date),
        escapeCsv(o.time),
        escapeCsv(o.orderType.toUpperCase()),
        escapeCsv(o.tableNumber),
        escapeCsv(o.customerName || 'Walk-in'),
        escapeCsv(itemsSummary),
        escapeCsv(totalItemCount),
        escapeCsv(o.subtotal),
        escapeCsv(o.discountAmount),
        escapeCsv(o.taxAmount),
        escapeCsv(o.grandTotal),
        escapeCsv(o.paymentMethod.toUpperCase()),
        escapeCsv(o.syncedToSheets ? 'YES' : 'NO'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `Hotspot_Orders_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Backup entire POS database to a JSON file
  createFullBackup(): void {
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      backupDate: new Date().toISOString(),
      restaurant: 'Hotspot Reception Billing',
      settings: this.getSettings(),
      categories: this.getCategories(),
      menuItems: this.getMenuItems(),
      orders: this.getOrders(),
      orderCounter: safeJsonParse<number>(STORAGE_KEYS.ORDER_COUNTER, 0),
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `Hotspot_POS_Backup_${today}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Restore POS database from JSON string
  restoreFromBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.' };
      }

      if (data.settings) {
        this.saveSettings({ ...INITIAL_SETTINGS, ...data.settings });
      }
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (Array.isArray(data.menuItems)) {
        this.saveMenuItems(data.menuItems);
      }
      if (Array.isArray(data.orders)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      }
      if (typeof data.orderCounter === 'number') {
        localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, JSON.stringify(data.orderCounter));
      }

      return { success: true, message: 'Data restored successfully!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse backup JSON.' };
    }
  },

  // Reset to initial sample data
  resetToSampleData(): void {
    this.saveMenuItems(INITIAL_MENU_ITEMS);
    this.saveCategories(INITIAL_CATEGORIES);
    this.saveSettings(INITIAL_SETTINGS);
  },
};
