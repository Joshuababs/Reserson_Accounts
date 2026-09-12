import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format minor currency units (e.g. cents) into a localized currency string. */
export function formatMoney(minorUnits: number, currency = "EUR", locale = "en-IE"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(minorUnits / 100);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Turns a snake_case API value into words.
 *
 * Exists because `String.replace("_", " ")` only replaces the first underscore,
 * which left "pay_on_arrival" reading as "pay on_arrival" on the booking screens.
 * Pair it with `capitalize` in the class list where a leading capital is wanted.
 */
export function humanize(value: string): string {
  return value.split("_").join(" ");
}
