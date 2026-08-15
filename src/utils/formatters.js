/**
 * Utilidades para formatear moneda, fechas y deducir día de la semana.
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount) || amount === '') return '$ 0';
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(absNum);

  return isNegative ? `-$ ${formatted}` : `$ ${formatted}`;
}

export function parseCurrency(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  // Extraer números y signo menos
  const cleaned = str.toString().replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function deduceDayOfWeek(dateStr) {
  if (!dateStr) return '';
  // Separar fecha YYYY-MM-DD para evitar problemas de zona horaria local
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getCurrentMonthYear() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return { month, year: String(year) };
}
