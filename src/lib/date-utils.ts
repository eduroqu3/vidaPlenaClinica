import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Parses a YYYY-MM-DD date string into a Date object representing local midnight.
 * This avoids the common "one day off" issue caused by UTC conversion.
 */
export const parseYYYYMMDD = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a YYYY-MM-DD string into a Brazillian date format DD/MM/YYYY.
 */
export const formatBrazillianDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formats a Date object or YYYY-MM-DD string using date-fns in Brazillian Portuguese,
 * ensuring no timezone shift for plain date strings.
 */
export const formatDateSafe = (date: string | Date | undefined | null, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = parseYYYYMMDD(date);
    return format(parsed, formatStr, { locale: ptBR });
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ptBR });
};
