import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Extract amount from UPI string if present (am= parameter)
 */
export function extractAmountFromUpi(upiString: string): number | null {
  const match = upiString.match(/[?&]am=([^&]+)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    return isNaN(amount) ? null : amount;
  }
  return null;
}
