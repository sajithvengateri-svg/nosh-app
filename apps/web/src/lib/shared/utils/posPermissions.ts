// POS Permissions — pure functions, zero dependencies

import type { POSRole } from '../types/pos.types';

const ROLE_HIERARCHY: Record<POSRole, number> = {
  manager: 4,
  supervisor: 3,
  bartender: 2,
  waiter: 2,
  cashier: 1,
};

function hasLevel(role: POSRole, minLevel: number): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= minLevel;
}

export const canTakeOrders = (_role: POSRole) => true;
export const canProcessPayments = (_role: POSRole) => true;
export const canApplyDiscount = (role: POSRole, pct: number) => pct <= 10 || hasLevel(role, 3);
export const canVoid = (role: POSRole) => hasLevel(role, 3);
export const canRefund = (role: POSRole) => hasLevel(role, 3);
export const canOpenDrawer = (role: POSRole) => hasLevel(role, 3);
export const canViewDashboard = (role: POSRole) => hasLevel(role, 2);
export const canManageMenu = (role: POSRole) => hasLevel(role, 3);
export const canManageStaff = (role: POSRole) => hasLevel(role, 4);
export const canViewAudit = (role: POSRole) => hasLevel(role, 3);
export const canEditSettings = (role: POSRole) => hasLevel(role, 4);
export const canManageFunctions = (role: POSRole) => hasLevel(role, 3);
