import React from 'react';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { numeroALetras } from '../utils/numberToWords';

export default function MoneyInput({
  label,
  value,
  onChange,
  placeholder = '$ 0',
  disabled = false,
  required = false,
  id
}) {
  const numericVal = typeof value === 'number' ? value : parseCurrency(value);
  const formattedDisplay = value !== '' && value !== null && value !== undefined 
    ? formatCurrency(numericVal) 
    : '';

  const handleChange = (e) => {
    const rawInput = e.target.value;
    const parsed = parseCurrency(rawInput);
    onChange(parsed);
  };

  const words = numericVal > 0 ? numeroALetras(numericVal) : '';

  return (
    <div className="money-input-container">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={formattedDisplay}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-white font-black text-xl tracking-wide focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-60 shadow-inner"
      />
      {words && (
        <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50 italic">
          🗣️ {words}
        </p>
      )}
    </div>
  );
}
