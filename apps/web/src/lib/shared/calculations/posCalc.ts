// POS Calculations — pure math, zero dependencies

import type { CartItem } from '../types/pos.types';

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
    return sum + item.quantity * (item.unitPrice + modTotal);
  }, 0);
}

export function calcTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

export function calcSurcharge(subtotal: number, surchargeRate: number): number {
  return Math.round(subtotal * surchargeRate * 100) / 100;
}

export function calcDiscount(subtotal: number, discountPct: number, discountAmt: number): number {
  const pctDisc = Math.round(subtotal * (discountPct / 100) * 100) / 100;
  return pctDisc + discountAmt;
}

export function calcTotal(subtotal: number, tax: number, surcharge: number, discount: number): number {
  return Math.round((subtotal + tax + surcharge - discount) * 100) / 100;
}

export function calcChange(tendered: number, total: number): number {
  return Math.max(0, Math.round((tendered - total) * 100) / 100);
}

export function calcSplitAmounts(total: number, splits: number): number[] {
  if (splits <= 0) return [total];
  const each = Math.floor((total / splits) * 100) / 100;
  const remainder = Math.round((total - each * splits) * 100) / 100;
  return Array.from({ length: splits }, (_, i) => i === 0 ? each + remainder : each);
}

/** Returns minutes since sentAt */
export function calcTicketAge(sentAt: string | Date): number {
  const sent = typeof sentAt === 'string' ? new Date(sentAt) : sentAt;
  return Math.floor((Date.now() - sent.getTime()) / 60000);
}

/** Returns colour tier based on ticket age in minutes */
export function getTicketColour(minutes: number): 'green' | 'amber' | 'red' {
  if (minutes < 5) return 'green';
  if (minutes < 8) return 'amber';
  return 'red';
}
