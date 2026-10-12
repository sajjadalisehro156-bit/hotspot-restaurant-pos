import React, { useState, useMemo } from 'react';
import { Order, RestaurantSettings } from '../types';
import { 
  Search, 
  Download, 
  Calendar, 
  Receipt, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  TrendingUp, 
  ShoppingBag, 
  Utensils, 
  Coins
} from 'lucide-react';
import { SheetsSyncService } from '../services/sheetsSync';

interface OrdersHistoryProps {
  orders: Order[];
  onSelectOrderToView: (order: Order) => void;
  onOrdersUpdated: () => void;
  currencySymbol: string;
  settings: RestaurantSettings;
  onExportCsv: () => void;
}

export const OrdersHistory: React.FC<OrdersHistoryProps> = ({
  orders,
  onSelectOrderToView,
  onOrdersUpdated,
  currencySymbol,
  settings,
  onExportCsv,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'today' | 'all' | 'custom'>('today');
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date filter
      if (filterType === 'today' && order.date !== todayStr) return false;
      if (filterType === 'custom' && selectedDate && order.date !== selectedDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBill = order.billNo.toLowerCase().includes(q);
        const matchCustomer = (order.customerName || '').toLowerCase().includes(q);
        const matchTable = order.tableNumber.toLowerCase().includes(q);
        if (!matchBill && !matchCustomer && !matchTable) return false;
      }

      return true;
    });
  }, [orders, filterType, selectedDate, searchQuery, todayStr]);

  // Daily Summary Metrics
  const summaryMetrics = useMemo(() => {
    const list = filterType === 'today' ? orders.filter((o) => o.date === todayStr) : filteredOrders;
    const totalOrders = list.length;
    const totalSales = list.reduce((sum, o) => sum + o.grandTotal, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const dineInCount = list.filter((o) => o.orderType === 'dine-in').length;
    const takeawayCount = list.filter((o) => o.orderType === 'takeaway' || o.orderType === 'delivery').length;

    return {
      totalOrders,
      totalSales,
      avgOrderValue,
      dineInCount,
      takeawayCount,
    };
  }, [orders, filteredOrders, filterType, todayStr]);

  const handleSyncSingleOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingOrderId(order.id);
    await SheetsSyncService.syncOrder(order);
    setSyncingOrderId(null);
    onOrdersUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders Card */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {filterType === 'today' ? "Today's Orders" : 'Filtered Orders'}
            </p>
            <h4 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white font-mono-numbers">
              {summaryMetrics.totalOrders}
            </h4>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Sales</p>
            <h4 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white font-mono-numbers">
              {currencySymbol} {summaryMetrics.totalSales.toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Average Bill */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Avg Order Value</p>
            <h4 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white font-mono-numbers">
              {currencySymbol} {summaryMetrics.avgOrderValue.toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Dine In vs Takeaway */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Order Channels</p>
            <p className="text-xs font-bold text-stone-900 dark:text-white font-mono-numbers mt-0.5">
              <span>{summaryMetrics.dineInCount} Dine</span>
              <span className="mx-1 text-stone-400">/</span>
              <span>{summaryMetrics.takeawayCount} Takeaway</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'today'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              All Orders
            </button>
            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'custom'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Custom Date
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Search input & CSV export */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[260px] justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bill #, guest, or table..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer whitespace-nowrap"
            title="Export orders as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-stone-400 dark:text-stone-500">
            <Receipt className="w-10 h-10 mx-auto opacity-40 mb-2" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No orders found</p>
            <p className="text-xs text-stone-400 mt-0.5">
              No bills recorded matching your filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type / Table</th>
                  <th className="py-3 px-4">Dishes Summary</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Sheets Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredOrders.map((order) => {
                  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
                  const firstItems = order.items
                    .slice(0, 2)
                    .map((i) => `${i.name} (x${i.quantity})`)
                    .join(', ');
                  const remaining = order.items.length - 2;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrderToView(order)}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
                    >
                      {/* Bill No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        #{order.billNo}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 whitespace-nowrap font-mono-numbers">
                        <div>{order.time}</div>
                        <div className="text-[10px] text-stone-400">{order.date}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200">
                        {order.customerName || 'Walk-in'}
                      </td>

                      {/* Type / Table */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {order.tableNumber}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                        <span>{firstItems}</span>
                        {remaining > 0 && (
                          <span className="text-[10px] text-stone-400 ml-1 font-mono">
                            +{remaining} more
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {itemsCount} item{itemsCount > 1 ? 's' : ''} total
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-stone-900 dark:text-white font-mono-numbers text-sm">
                        {currencySymbol} {order.grandTotal.toLocaleString()}
                      </td>

                      {/* Google Sheets status */}
                      <td className="py-3.5 px-4 text-center">
                        {order.syncedToSheets ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Synced</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleSyncSingleOrder(order, e)}
                            disabled={syncingOrderId === order.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold hover:bg-amber-100 transition-colors"
                            title="Click to sync this order to Google Sheets"
                          >
                            <RotateCw
                              className={`w-3 h-3 ${syncingOrderId === order.id ? 'animate-spin' : ''}`}
                            />
                            <span>Retry</span>
                          </button>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrderToView(order);
                          }}
                          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                          title="View / Reprint Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
