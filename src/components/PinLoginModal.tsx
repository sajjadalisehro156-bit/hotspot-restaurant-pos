import React, { useState } from 'react';
import { Lock, Delete, ArrowRight, X, Flame } from 'lucide-react';

interface PinLoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  requiredRole: 'receptionist' | 'admin';
  validPin: string;
  title?: string;
  subtitle?: string;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  requiredRole,
  validPin,
  title,
  subtitle,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorAnimation, setErrorAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + num;
      setPinInput(next);
      setErrorMessage('');
      // Auto verify if 4 or 6 digits match
      if (next === validPin) {
        setTimeout(() => {
          setPinInput('');
          onSuccess();
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === validPin) {
      setPinInput('');
      onSuccess();
    } else {
      setErrorAnimation(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => setErrorAnimation(false), 500);
      setPinInput('');
    }
  };

  const defaultTitle = requiredRole === 'admin' ? 'Admin Authorization Required' : 'Counter Locked';
  const defaultSub =
    requiredRole === 'admin'
      ? 'Enter 4-digit Admin PIN to manage menu dishes and settings'
      : 'Enter Receptionist PIN to unlock the counter POS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col items-center text-center">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-3">
          {requiredRole === 'admin' ? <Lock className="w-6 h-6" /> : <Flame className="w-6 h-6 fill-white" />}
        </div>

        <h3 className="text-base font-bold text-stone-900 dark:text-white">{title || defaultTitle}</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-[240px]">
          {subtitle || defaultSub}
        </p>

        {/* PIN Indicators */}
        <div
          className={`flex items-center gap-3 my-5 transition-transform ${
            errorAnimation ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < pinInput.length
                  ? 'bg-amber-500 scale-110 shadow-xs shadow-amber-500/40'
                  : 'bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs font-semibold text-rose-500 mb-3 animate-fade-in">{errorMessage}</p>
        )}

        {/* Touch-Friendly Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-mono text-lg font-bold hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-mono text-lg font-bold hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={pinInput.length === 0}
          className="mt-4 w-full max-w-[240px] flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <span>Unlock</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <p className="text-[10px] text-stone-400 mt-3 font-mono">
          Default {requiredRole === 'admin' ? 'Admin' : 'Cashier'} PIN:{' '}
          <span className="font-bold underline">{validPin}</span>
        </p>
      </div>
    </div>
  );
};
