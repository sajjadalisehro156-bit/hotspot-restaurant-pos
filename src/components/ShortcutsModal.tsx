import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F2', label: 'Jump to Menu Search', desc: 'Immediately focuses the dish search bar' },
    { key: 'F9', label: 'Generate Receipt', desc: 'Completes current order and triggers receipt view' },
    { key: 'Ctrl + P', label: 'Print Receipt', desc: 'Prints the thermal 80mm or A4 invoice' },
    { key: 'Esc', label: 'Close Modal / Cancel', desc: 'Closes dialogs, previews, or clear alerts' },
    { key: 'Tab', label: 'Navigate Inputs', desc: 'Swiftly tabs between customer name & cash tendered' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Counter Speed Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800"
            >
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100">{sc.label}</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{sc.desc}</p>
              </div>
              <span className="px-2 py-1 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg font-mono font-bold text-stone-800 dark:text-stone-200 shadow-2xs whitespace-nowrap text-[11px]">
                {sc.key}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
