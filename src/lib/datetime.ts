import { format } from "date-fns";
import { de } from "date-fns/locale";

const locale = de;

export function formatDate(value: Date | string, pattern = "dd.MM.yyyy") {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, pattern, { locale });
}

export function formatTime(value: Date | string, pattern = "HH:mm") {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, pattern, { locale });
}

export function formatDateTime(value: Date | string, pattern = "dd.MM.yyyy HH:mm") {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, pattern, { locale });
}

export function formatDateRange(from: Date | string, to: Date | string, pattern = "dd.MM.") {
  return formatDate(from, pattern) + " - " + formatDate(to, pattern === "dd.MM." ? "dd.MM.yyyy" : pattern);
}

export const currentLocale = "de-DE";
