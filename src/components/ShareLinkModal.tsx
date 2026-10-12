import React, { useState } from 'react';
import { Laptop, Copy, Check, X, ExternalLink, QrCode } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                ایپ کا لنک (App Link)
              </h3>
              <p className="text-[11px] text-stone-500">کسی بھی دوسرے لیپ ٹاپ یا موبائل پر چلائیں</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              اس لنک کو دوسرے لیپ ٹاپ کے براؤزر میں کھولیں:
            </label>
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-transparent font-mono text-[11px] text-stone-800 dark:text-stone-200 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-900/60 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200 space-y-1.5">
            <p className="font-bold">استعمال کرنے کا طریقہ:</p>
            <p>1. یہ لنک واٹس ایپ یا ای میل کے ذریعے دوسرے لیپ ٹاپ پر بھیجیں۔</p>
            <p>2. دوسرے لیپ ٹاپ میں <strong>Google Chrome</strong> کھولیں اور یہ لنک پیسٹ کریں۔</p>
            <p>3. بغیر کسی سافٹ ویئر انسٹال کیے رسیدیں بننا اور پرنٹ ہونا شروع ہو جائیں گی!</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
