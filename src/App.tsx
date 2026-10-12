/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MenuItem, 
  OrderItem, 
  Order, 
  RestaurantSettings, 
  OrderType, 
  DiscountType, 
  PaymentMethod 
} from './types';
import { StorageService } from './services/storage';
import { SheetsSyncService } from './services/sheetsSync';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { CurrentOrderPanel } from './components/CurrentOrderPanel';
import { ReceiptModal } from './components/ReceiptModal';
import { OrdersHistory } from './components/OrdersHistory';
import { AdminPanel } from './components/AdminPanel';
import { PinLoginModal } from './components/PinLoginModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ShareLinkModal } from './components/ShareLinkModal';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('hotspot_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hotspot_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hotspot_theme', 'light');
    }
  }, [darkMode]);

  // Primary Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => StorageService.getMenuItems());
  const [categories, setCategories] = useState<string[]>(() => StorageService.getCategories());
  const [settings, setSettings] = useState<RestaurantSettings>(() => StorageService.getSettings());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'pos' | 'history' | 'admin'>('pos');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => StorageService.getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);

  // Security / PIN Authentication State
  const [isCounterLocked, setIsCounterLocked] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);

  // Counter POS Order Working State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Filter & Search in POS Menu
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Receipt Modal State
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Shortcuts Modal State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);

  // Feedback Toast Banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Sync Pending Queue
  const runSyncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await SheetsSyncService.syncPendingQueue();
      setPendingSyncCount(StorageService.getSyncQueue().length);
      setOrders(StorageService.getOrders());
      if (res.syncedCount > 0) {
        showToast(`Synced ${res.syncedCount} queued order(s) to Google Sheets`, 'success');
      }
    } catch {
      // ignore network errors
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, showToast]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Internet connection restored. Syncing orders...', 'info');
      runSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Counter will continue working seamlessly!', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runSyncQueue, showToast]);

  // Add Item to Current Order
  const handleSelectItem = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        const newItem: OrderItem = {
          id: 'ord_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update Item Quantity
  const handleUpdateQuantity = (id: string, delta: number) => {
    setOrderItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear Order
  const handleClearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setDiscountValue(0);
    setAmountPaid(0);
    setTableNumber(orderType === 'dine-in' ? 'Table 1' : orderType === 'takeaway' ? 'Takeaway' : 'Delivery');
  };

  // Generate Receipt
  const handleGenerateReceipt = async () => {
    if (orderItems.length === 0) {
      showToast('Cannot generate bill: Order is empty. Please add items.', 'error');
      return;
    }

    // Calculations
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const calculatedDiscount =
      discountType === 'percent'
        ? Math.round((subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100)
        : Math.min(Math.max(discountValue, 0), subtotal);

    const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
    const taxAmount = Math.round((taxableAmount * settings.taxRate) / 100);
    const grandTotal = taxableAmount + taxAmount;
    const changeDue = Math.max(0, amountPaid - grandTotal);

    // Auto-increment bill number
    const { billNo, orderNumber } = StorageService.getNextBillNumber();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      billNo,
      orderNumber,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      customerName: customerName.trim() || 'Walk-in',
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : orderType === 'takeaway' ? 'Takeaway' : 'Delivery',
      items: [...orderItems],
      subtotal,
      discountType,
      discountValue,
      discountAmount: calculatedDiscount,
      taxRate: settings.taxRate,
      taxAmount,
      grandTotal,
      paymentMethod,
      amountPaid: amountPaid > 0 ? amountPaid : grandTotal,
      changeGiven: changeDue,
      syncedToSheets: false,
    };

    // Save order locally
    StorageService.saveOrder(newOrder);
    setOrders(StorageService.getOrders());

    // Show receipt modal
    setActiveReceiptOrder(newOrder);
    setShowReceiptModal(true);

    // Sync to Google Sheets in background
    if (settings.googleAppsScriptUrl) {
      SheetsSyncService.syncOrder(newOrder).then((syncRes) => {
        setPendingSyncCount(StorageService.getSyncQueue().length);
        setOrders(StorageService.getOrders());
        if (syncRes.success) {
          showToast(`Order #${newOrder.billNo} synced to Google Sheets`, 'success');
        } else {
          showToast(`Order #${newOrder.billNo} saved locally (sync queued)`, 'info');
        }
      });
    } else {
      showToast(`Bill #${newOrder.billNo} created successfully!`, 'success');
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 -> focus search input
      if (e.key === 'F2') {
        e.preventDefault();
        if (currentTab !== 'pos') setCurrentTab('pos');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // F9 -> Generate Receipt
      else if (e.key === 'F9') {
        e.preventDefault();
        if (currentTab === 'pos' && orderItems.length > 0 && !showReceiptModal) {
          handleGenerateReceipt();
        }
      }
      // Esc -> close open modals
      else if (e.key === 'Escape') {
        if (showReceiptModal) setShowReceiptModal(false);
        if (showShortcutsModal) setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, orderItems, showReceiptModal, showShortcutsModal, handleGenerateReceipt]);

  // Handle Tab Change with Admin Protection
  const handleTabChange = (tab: 'pos' | 'history' | 'admin') => {
    if (tab === 'admin') {
      if (isAdminUnlocked) {
        setCurrentTab('admin');
      } else {
        setShowAdminPinModal(true);
      }
    } else {
      setCurrentTab(tab);
    }
  };

  // Admin PIN Success
  const handleAdminAuthSuccess = () => {
    setIsAdminUnlocked(true);
    setShowAdminPinModal(false);
    setCurrentTab('admin');
    showToast('Admin access granted', 'success');
  };

  // Receptionist Unlock Success
  const handleCounterUnlockSuccess = () => {
    setIsCounterLocked(false);
    showToast('Counter unlocked', 'success');
  };

  // Refresh all data
  const handleRefreshAllData = () => {
    setMenuItems(StorageService.getMenuItems());
    setCategories(StorageService.getCategories());
    setSettings(StorageService.getSettings());
    setOrders(StorageService.getOrders());
    setPendingSyncCount(StorageService.getSyncQueue().length);
  };

  // Preview / Test Receipt (Even with 0 items)
  const handlePreviewSampleReceipt = useCallback(() => {
    if (orders.length > 0) {
      setActiveReceiptOrder(orders[0]);
      setShowReceiptModal(true);
      return;
    }

    const sampleOrder: Order = {
      id: 'sample_preview',
      billNo: '0001',
      orderNumber: 1,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
      customerName: customerName.trim() || 'Bilal Ahmed',
      orderType: orderType || 'dine-in',
      tableNumber: tableNumber || 'Table 4',
      items:
        orderItems.length > 0
          ? [...orderItems]
          : [
              { id: 's1', menuItemId: 'b-01', name: 'Crispy Zinger Burger', price: 550, quantity: 2 },
              { id: 's2', menuItemId: 'dr-01', name: 'Fresh Mint Lemonade', price: 240, quantity: 2 },
              { id: 's3', menuItemId: 'ff-01', name: 'Loaded Hotspot Fries', price: 490, quantity: 1 },
            ],
      subtotal: 2070,
      discountType: 'percent',
      discountValue: 10,
      discountAmount: 207,
      taxRate: settings.taxRate || 5,
      taxAmount: 93,
      grandTotal: 1956,
      paymentMethod: 'cash',
      amountPaid: 2000,
      changeGiven: 44,
      syncedToSheets: true,
    };

    setActiveReceiptOrder(sampleOrder);
    setShowReceiptModal(true);
  }, [orders, customerName, orderType, tableNumber, orderItems, settings.taxRate]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 border ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700'
                : 'bg-stone-900/90 text-stone-200 border-stone-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onManualSync={runSyncQueue}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLockCounter={() => setIsCounterLocked(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        restaurantName={settings.restaurantName}
        onOpenReceipt={handlePreviewSampleReceipt}
        lastBillNo={orders[0]?.billNo}
        onOpenShareLink={() => setShowShareLinkModal(true)}
      />

      {/* Screen Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col">
        {/* VIEW 1: COUNTER POS */}
        {currentTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left Column: Menu Items & Category Filter (approx 7-8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col lg:h-[calc(100vh-6rem)]">
              <MenuGrid
                items={menuItems}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectItem={handleSelectItem}
                currencySymbol={settings.currencySymbol}
                searchInputRef={searchInputRef}
              />
            </div>

            {/* Right Column: Sticky Current Order & Billing Calculator (approx 4-5 cols) */}
            <div
              id="current-order-section"
              className="lg:col-span-5 xl:col-span-4 flex flex-col lg:h-[calc(100vh-6rem)]"
            >
              <CurrentOrderPanel
                orderItems={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearOrder={handleClearOrder}
                onGenerateReceipt={handleGenerateReceipt}
                onPreviewSampleReceipt={handlePreviewSampleReceipt}
                customerName={customerName}
                setCustomerName={setCustomerName}
                orderType={orderType}
                setOrderType={setOrderType}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                taxRate={settings.taxRate}
                currencySymbol={settings.currencySymbol}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                amountPaid={amountPaid}
                setAmountPaid={setAmountPaid}
                hasPastOrders={orders.length > 0}
                lastBillNo={orders[0]?.billNo}
                onViewLastReceipt={() => {
                  if (orders.length > 0) {
                    setActiveReceiptOrder(orders[0]);
                    setShowReceiptModal(true);
                  }
                }}
              />
            </div>

            {/* Mobile / Small Screen Quick Order Bar */}
            {orderItems.length > 0 && (
              <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('current-order-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-stone-900 text-white rounded-2xl shadow-2xl border border-stone-700 cursor-pointer"
                >
                  <span className="text-xs font-bold font-mono">
                    {orderItems.reduce((s, i) => s + i.quantity, 0)} Items | {settings.currencySymbol}{' '}
                    {orderItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-amber-400">View Bill & Receipt →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORDERS HISTORY */}
        {currentTab === 'history' && (
          <div className="flex-1 overflow-y-auto pb-8">
            <OrdersHistory
              orders={orders}
              onSelectOrderToView={(order) => {
                setActiveReceiptOrder(order);
                setShowReceiptModal(true);
              }}
              onOrdersUpdated={handleRefreshAllData}
              currencySymbol={settings.currencySymbol}
              settings={settings}
              onExportCsv={() => StorageService.exportOrdersToCSV()}
            />
          </div>
        )}

        {/* VIEW 3: ADMIN & MENU MANAGEMENT */}
        {currentTab === 'admin' && (
          <div className="flex-1 overflow-y-auto pb-8">
            <AdminPanel
              menuItems={menuItems}
              categories={categories}
              settings={settings}
              onSaveMenuItems={(updated) => {
                StorageService.saveMenuItems(updated);
                setMenuItems(updated);
                showToast('Menu dishes updated', 'success');
              }}
              onSaveCategories={(updated) => {
                StorageService.saveCategories(updated);
                setCategories(updated);
                showToast('Categories updated', 'success');
              }}
              onSaveSettings={(updated) => {
                StorageService.saveSettings(updated);
                setSettings(updated);
                showToast('Settings saved', 'success');
              }}
              onDataRestored={handleRefreshAllData}
              currencySymbol={settings.currencySymbol}
            />
          </div>
        )}
      </main>

      {/* RECEIPT MODAL */}
      <ReceiptModal
        order={activeReceiptOrder}
        settings={settings}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onNewOrder={() => {
          setShowReceiptModal(false);
          handleClearOrder();
        }}
      />

      {/* KEYBOARD SHORTCUTS MODAL */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* COUNTER LOCK PIN MODAL */}
      <PinLoginModal
        isOpen={isCounterLocked}
        onSuccess={handleCounterUnlockSuccess}
        requiredRole="receptionist"
        validPin={settings.receptionistPin || '1234'}
        title="Reception Counter Locked"
        subtitle="Enter 4-digit Cashier PIN (or Admin PIN) to resume taking orders"
      />

      {/* ADMIN AUTHORIZATION PIN MODAL */}
      <PinLoginModal
        isOpen={showAdminPinModal}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setShowAdminPinModal(false)}
        requiredRole="admin"
        validPin={settings.adminPin || '9999'}
        title="Admin Security Verification"
        subtitle="Enter Admin PIN to access Menu Editor, Taxes, and System Settings"
      />

      {/* SHARE LINK / OTHER LAPTOP MODAL */}
      <ShareLinkModal
        isOpen={showShareLinkModal}
        onClose={() => setShowShareLinkModal(false)}
      />
    </div>
  );
}
