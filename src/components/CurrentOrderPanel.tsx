import React, { useState } from 'react';
import { OrderItem, OrderType, DiscountType, PaymentMethod } from '../types';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Percent, 
  Coins, 
  CreditCard, 
  Wallet, 
  Utensils, 
  Car, 
  FileText, 
  RotateCcw
} from 'lucide-react';

interface CurrentOrderPanelProps {
  orderItems: OrderItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onGenerateReceipt: () => void;
  onPreviewSampleReceipt: () => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  orderType: OrderType;
  setOrderType: (val: OrderType) => void;
  tableNumber: string;
  setTableNumber: (val: string) => void;
  discountType: DiscountType;
  setDiscountType: (val: DiscountType) => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  taxRate: number;
  currencySymbol: string;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (val: number) => void;
  hasPastOrders?: boolean;
  lastBillNo?: string;
  onViewLastReceipt?: () => void;
}

export const CurrentOrderPanel: React.FC<CurrentOrderPanelProps> = ({
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onGenerateReceipt,
  onPreviewSampleReceipt,
  customerName,
  setCustomerName,
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  taxRate,
  currencySymbol,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  hasPastOrders,
  lastBillNo,
  onViewLastReceipt,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Calculations
  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100)
      : Math.min(Math.max(discountValue, 0), subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const grandTotal = taxableAmount + taxAmount;
  const changeDue = Math.max(0, amountPaid - grandTotal);

  const totalItemsCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
      {/* Header with order type switches */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 space-y-3 bg-stone-50/60 dark:bg-stone-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Current Order
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {hasPastOrders && onViewLastReceipt && (
              <button
                type="button"
                onClick={onViewLastReceipt}
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="View previous receipt"
              >
                <FileText className="w-3 h-3" />
                <span>Last #{lastBillNo}</span>
              </button>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono-numbers">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Order Type Segmented Control */}
        <div className="grid grid-cols-3 gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setOrderType('dine-in');
              if (tableNumber === 'Takeaway' || tableNumber === 'Delivery') {
                setTableNumber('Table 1');
              }
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              orderType === 'dine-in'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderType('takeaway');
              setTableNumber('Takeaway');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              orderType === 'takeaway'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeaway</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderType('delivery');
              setTableNumber('Delivery');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              orderType === 'delivery'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Customer & Table details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Bilal Ahmed / Walk-in"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
              {orderType === 'dine-in' ? 'Table Number' : 'Order Mode'}
            </label>
            {orderType === 'dine-in' ? (
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {Array.from({ length: 25 }, (_, i) => `Table ${i + 1}`).map((tbl) => (
                  <option key={tbl} value={tbl}>
                    {tbl}
                  </option>
                ))}
                <option value="VIP Lounge 1">VIP Lounge 1</option>
                <option value="VIP Lounge 2">VIP Lounge 2</option>
                <option value="Rooftop Deck">Rooftop Deck</option>
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={orderType === 'takeaway' ? 'Counter Pickup' : 'Home Delivery'}
                className="w-full px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-600 dark:text-stone-400 text-xs cursor-default"
              />
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {orderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-stone-400 dark:text-stone-500">
            <ShoppingBag className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-xs font-semibold">Your order is currently empty</p>
            <p className="text-[11px] mt-0.5">Tap any menu dish on the left to add it here</p>
          </div>
        ) : (
          orderItems.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-mono-numbers">
                    <span>{currencySymbol} {item.price}</span>
                    <span>×</span>
                    <span>{item.quantity}</span>
                    <span>=</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {currencySymbol} {lineTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Steppers */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Financial Calculations & Payment Section */}
      <div className="p-4 bg-stone-50/80 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 space-y-3">
        {/* Discount input toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400 font-medium flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              <span>Discount</span>
            </span>
            <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                  discountType === 'percent'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-500'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                  discountType === 'fixed'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-500'
                }`}
              >
                Rs
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={discountType === 'percent' ? 100 : subtotal}
              value={discountValue === 0 ? '' : discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              placeholder={discountType === 'percent' ? 'e.g. 10 (10%)' : 'e.g. 150 (Rs)'}
              className="w-full px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white text-xs font-mono-numbers focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {discountAmount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-mono-numbers">
                -Rs {discountAmount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Live Calculation Lines */}
        <div className="space-y-1 text-xs pt-1 border-t border-stone-200/60 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-mono-numbers">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {currencySymbol} {subtotal.toLocaleString()}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>
                Discount ({discountType === 'percent' ? `${discountValue}%` : 'Flat'})
              </span>
              <span>-{currencySymbol} {discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Sales Tax ({taxRate}%)</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {currencySymbol} {taxAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-sm font-extrabold text-stone-900 dark:text-white pt-1.5 border-t border-stone-200 dark:border-stone-800">
            <span className="font-sans">Grand Total</span>
            <span className="text-base text-amber-600 dark:text-amber-400 font-mono-numbers">
              {currencySymbol} {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Method & Cash Tendered */}
        <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 space-y-2">
          <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('online_wallet')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all cursor-pointer ${
                paymentMethod === 'online_wallet'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <Wallet className="w-3 h-3" />
              <span>Wallet</span>
            </button>
          </div>

          {/* Quick Cash Tendered input */}
          {paymentMethod === 'cash' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-0.5">
                  Cash Received
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid === 0 ? '' : amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  placeholder="e.g. 2000"
                  className="w-full px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-mono-numbers text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-0.5">
                  Change Due
                </label>
                <div className="px-2 py-1 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
                  {currencySymbol} {changeDue.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={orderItems.length > 0 ? onGenerateReceipt : onPreviewSampleReceipt}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 shadow-amber-500/25 active:scale-[0.99] cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>
              {orderItems.length > 0 ? 'Generate Receipt' : 'Receipt / Print Preview'}
            </span>
            <span className="text-[10px] font-mono opacity-80 border border-white/30 px-1 rounded ml-1">
              F9
            </span>
          </button>

          {orderItems.length === 0 && (
            <button
              type="button"
              onClick={onPreviewSampleReceipt}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer border border-amber-200 dark:border-amber-800/60"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Test / View Sample Receipt Format</span>
            </button>
          )}

          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-medium flex-1 pl-1">
                Clear all items?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearOrder();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 text-xs font-semibold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={orderItems.length === 0}
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
