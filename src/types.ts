export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type DiscountType = 'percent' | 'fixed';

export type PaymentMethod = 'cash' | 'card' | 'online_wallet';

export type PrinterFormat = 'thermal-80mm' | 'a4';

export interface MenuItem {
  id: string;
  name: string;
  urduName?: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  description?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  billNo: string; // Formatted e.g. "HS-0001" or "0001"
  orderNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  timestamp: number;
  customerName: string;
  orderType: OrderType;
  tableNumber: string; // "Table 1" or "Takeaway" or "Delivery"
  items: OrderItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number; // Percentage, e.g. 5
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeGiven: number;
  syncedToSheets: boolean;
  syncedAt?: number;
  syncError?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  address: string;
  phone1: string;
  phone2: string;
  ntnNumber: string;
  taxRate: number; // e.g. 5% or 16%
  currencySymbol: string; // e.g. "Rs"
  footerText: string;
  googleAppsScriptUrl: string;
  defaultPrinterType: PrinterFormat;
  receptionistPin: string;
  adminPin: string;
}

export interface SyncQueueItem {
  orderId: string;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}
