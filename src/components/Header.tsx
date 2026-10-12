import React from 'react';
import { 
  Flame, 
  Receipt, 
  History, 
  Settings2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sun, 
  Moon, 
  Lock, 
  Keyboard
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'pos' | 'history' | 'admin';
  setCurrentTab: (tab: 'pos' | 'history' | 'admin') => void;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLockCounter: () => void;
  onOpenShortcuts: () => void;
  restaurantName: string;
  onOpenReceipt: () => void;
  lastBillNo?: string;
  onOpenShareLink: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isOnline,
  pendingSyncCount,
  isSyncing,
  onManualSync,
  darkMode,
  setDarkMode,
  onLockCounter,
  onOpenShortcuts,
  restaurantName,
  onOpenReceipt,
  lastBillNo,
  onOpenShareLink,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900 dark:text-white uppercase font-sans">
                {restaurantName || 'Hotspot'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60">
                POS
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">Reception Billing Counter</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-start mt-2 sm:mt-0">
          <button
            type="button"
            onClick={() => setCurrentTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'pos'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Counter POS</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'history'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>Receipts & Bills History</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'admin'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Menu & Settings</span>
          </button>
        </nav>

        {/* Action & Utility Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 sm:order-3">
          {/* App Link Button (for other laptops) */}
          <button
            type="button"
            onClick={onOpenShareLink}
            title="دوسرے لیپ ٹاپ پر چلانے کا لنک (App Link)"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">App Link</span>
          </button>

          {/* Direct Receipt Viewer Button */}
          <button
            type="button"
            onClick={onOpenReceipt}
            title={lastBillNo ? `View / Print Last Receipt (#${lastBillNo})` : 'Preview Receipt (رسید کا پیش نظارہ)'}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {lastBillNo ? `Receipt #${lastBillNo}` : 'Receipt Preview'}
            </span>
            <span className="md:hidden">Receipt</span>
          </button>

          {/* Online / Offline Sync status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title="Internet Connected">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium" title="Offline Mode: Orders stored locally">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Offline</span>
              </span>
            )}

            {pendingSyncCount > 0 && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing || !isOnline}
                title={`${pendingSyncCount} order(s) pending Google Sheets sync`}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} Queue</span>
              </button>
            )}
          </div>

          {/* Keyboard Shortcuts button */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (F2, F9, Ctrl+P)"
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Lock Counter */}
          <button
            type="button"
            onClick={onLockCounter}
            title="Lock Counter Screen (Requires PIN)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
};
