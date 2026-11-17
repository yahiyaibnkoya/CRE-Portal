'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string | boolean;
  showToggle?: boolean;
  className?: string;
  id?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  length = 4,
  label,
  autoFocus = false,
  disabled = false,
  error,
  showToggle = true,
  className = '',
  id,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of single characters
  const digits: string[] = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const updateDigit = (index: number, newDigit: string) => {
    const nextDigits = [...digits];
    nextDigits[index] = newDigit;
    const combined = nextDigits.join('').replace(/\s/g, '');
    onChange(combined);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Clear current digit
        updateDigit(index, '');
      } else if (index > 0) {
        // Step back and clear previous digit
        updateDigit(index - 1, '');
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Keep only numeric characters
    const cleanDigits = rawVal.replace(/\D/g, '');

    if (!cleanDigits) {
      updateDigit(index, '');
      return;
    }

    // Single digit input
    const char = cleanDigits.slice(-1);
    updateDigit(index, char);

    // Auto-advance to next box if not on the last box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericChars = pastedData.replace(/\D/g, '').slice(0, length);
    if (!numericChars) return;

    onChange(numericChars);

    // Focus last filled box
    const focusIndex = Math.min(length - 1, numericChars.length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-bold text-slate-700">
            {label}
          </label>
          {showToggle && (
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              tabIndex={-1}
              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-cre-navy hover:text-cre-green transition-colors"
            >
              {isVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide PIN</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show PIN</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {Array.from({ length }, (_, idx) => {
          const isFilled = Boolean(digits[idx]);
          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type={isVisible ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[idx]}
              disabled={disabled}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              autoComplete="one-time-code"
              className={`w-12 h-13 sm:w-14 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border transition-all outline-hidden ${
                error
                  ? 'border-red-400 bg-red-50/50 text-red-700 focus:ring-2 focus:ring-red-400'
                  : isFilled
                  ? 'border-cre-navy/30 bg-cre-navy-light/40 text-cre-navy focus:ring-2 focus:ring-cre-green focus:border-cre-green'
                  : 'border-cre-border bg-slate-50/70 text-slate-900 focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`PIN Digit ${idx + 1}`}
            />
          );
        })}

        {!label && showToggle && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            tabIndex={-1}
            title={isVisible ? 'Hide Password' : 'Show Password'}
            className="p-2.5 rounded-xl border border-cre-border bg-white text-slate-500 hover:text-cre-navy hover:bg-slate-50 transition-colors shrink-0"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cre-navy" />}
          </button>
        )}
      </div>

      {typeof error === 'string' && error && (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};
