// Algoritmo Oficial de Festivos en Colombia (Ley 51 de 1983 - Ley Emiliani)
// Genera TODOS los festivos fijos, Ley Emiliani (traslado al lunes) y religiosos de la Pascua para cualquier año.

function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function moveToNextMonday(date) {
  const day = date.getDay();
  if (day === 1) return date; // Ya es lunes
  const add = day === 0 ? 1 : 8 - day;
  return addDays(date, add);
}

function formatDateStr(y, m, d) {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function formatDateFromObj(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getColombianHolidays(year) {
  const holidays = [];

  // 1. FESTIVOS FIJOS (6 festivos)
  holidays.push({ date: formatDateStr(year, 1, 1), name: 'Año Nuevo' });
  holidays.push({ date: formatDateStr(year, 5, 1), name: 'Día del Trabajo' });
  holidays.push({ date: formatDateStr(year, 7, 20), name: 'Día de la Independencia' });
  holidays.push({ date: formatDateStr(year, 8, 7), name: 'Batalla de Boyacá' });
  holidays.push({ date: formatDateStr(year, 12, 8), name: 'Inmaculada Concepción' });
  holidays.push({ date: formatDateStr(year, 12, 25), name: 'Navidad' });

  // 2. FESTIVOS LEY EMILIANI (7 festivos traslatorios al lunes)
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 0, 6))), name: 'Reyes Magos' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 2, 19))), name: 'San José' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 5, 29))), name: 'San Pedro y San Pablo' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 7, 15))), name: 'Asunción de la Virgen' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 9, 12))), name: 'Día de la Raza' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 10, 1))), name: 'Todos los Santos' });
  holidays.push({ date: formatDateFromObj(moveToNextMonday(new Date(year, 10, 11))), name: 'Independencia de Cartagena' });

  // 3. FESTIVOS BASADOS EN LA PASCUA (5 festivos)
  const easter = getEaster(year);
  
  const juevesSanto = addDays(easter, -3);
  const viernesSanto = addDays(easter, -2);
  const ascension = moveToNextMonday(addDays(easter, 43));
  const corpusChristi = moveToNextMonday(addDays(easter, 64));
  const sagradoCorazon = moveToNextMonday(addDays(easter, 71));

  holidays.push({ date: formatDateFromObj(juevesSanto), name: 'Jueves Santo' });
  holidays.push({ date: formatDateFromObj(viernesSanto), name: 'Viernes Santo' });
  holidays.push({ date: formatDateFromObj(ascension), name: 'Ascensión del Señor' });
  holidays.push({ date: formatDateFromObj(corpusChristi), name: 'Corpus Christi' });
  holidays.push({ date: formatDateFromObj(sagradoCorazon), name: 'Sagrado Corazón de Jesús' });

  return holidays;
}
