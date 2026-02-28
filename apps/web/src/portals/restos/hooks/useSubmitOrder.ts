import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { usePOSStore } from "@/lib/shared/state/posStore";
import {
  createPOSOrder,
  createPOSOrderItems,
  insertOrderEvent,
  createPOSPayment,
} from "@/lib/shared/queries/posQueries";
import { calcSubtotal, calcTax, calcSurcharge } from "@/lib/shared/calculations/posCalc";
import type { CartItem, POSOrderType, POSPaymentMethod } from "@/lib/shared/types/pos.types";
import { toast } from "sonner";

interface SubmitOrderParams {
  cart: CartItem[];
  orderType: POSOrderType;
  tableNumber: string;
  orderNotes: string;
  tabId?: string | null;
  taxRate?: number;
  cardSurchargePct?: number;
}

interface SubmitPaymentParams extends SubmitOrderParams {
  method: POSPaymentMethod;
  tip: number;
  tendered?: number;
  changeGiven?: number;
}

export function useSubmitOrder() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitOrderParams) => {
      if (!orgId) throw new Error("No org");
      const { cart, orderType, tableNumber, orderNotes, tabId, taxRate = 0.1 } = params;

      const subtotal = calcSubtotal(cart);
      const tax = calcTax(subtotal, taxRate);
      const total = Math.round((subtotal + tax) * 100) / 100;

      // 1. Create order
      const order = await createPOSOrder({
        org_id: orgId,
        order_type: orderType,
        status: "SENT",
        table_number: tableNumber || null,
        tab_id: tabId || null,
        subtotal,
        tax,
        surcharge: 0,
        discount: 0,
        total,
        notes: orderNotes || null,
      });

      // 2. Create order items
      const items = cart.map((ci) => ({
        order_id: order.id,
        menu_item_id: ci.menuItemId,
        item_name: ci.name,
        quantity: ci.quantity,
        unit_price: ci.unitPrice,
        modifiers: ci.modifiers,
        notes: ci.notes || null,
        station: ci.station,
        course_number: ci.courseNumber,
      }));
      await createPOSOrderItems(items);

      // 3. Insert order event
      await insertOrderEvent({
        order_id: order.id,
        event_type: "ORDER_SENT",
        data: { item_count: cart.length, order_type: orderType },
      });

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-orders"] });
    },
  });
}

export function useSubmitOrderWithPayment() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitPaymentParams) => {
      if (!orgId) throw new Error("No org");
      const {
        cart, orderType, tableNumber, orderNotes, tabId,
        taxRate = 0.1, cardSurchargePct = 0.015,
        method, tip, tendered, changeGiven,
      } = params;

      const subtotal = calcSubtotal(cart);
      const tax = calcTax(subtotal, taxRate);
      const surcharge = method === "CARD" ? calcSurcharge(subtotal + tax, cardSurchargePct) : 0;
      const total = Math.round((subtotal + tax + surcharge + tip) * 100) / 100;

      // 1. Create order (already PAID)
      const order = await createPOSOrder({
        org_id: orgId,
        order_type: orderType,
        status: "PAID",
        table_number: tableNumber || null,
        tab_id: tabId || null,
        subtotal,
        tax,
        surcharge,
        discount: 0,
        total,
        notes: orderNotes || null,
        paid_at: new Date().toISOString(),
      });

      // 2. Create order items
      const items = cart.map((ci) => ({
        order_id: order.id,
        menu_item_id: ci.menuItemId,
        item_name: ci.name,
        quantity: ci.quantity,
        unit_price: ci.unitPrice,
        modifiers: ci.modifiers,
        notes: ci.notes || null,
        station: ci.station,
        course_number: ci.courseNumber,
      }));
      await createPOSOrderItems(items);

      // 3. Create payment record
      await createPOSPayment({
        org_id: orgId,
        order_id: order.id,
        method,
        amount: total,
        tip,
        tendered: tendered ?? null,
        change_given: changeGiven ?? null,
        is_refund: false,
      });

      // 4. Insert order events
      await insertOrderEvent({
        order_id: order.id,
        event_type: "ORDER_CREATED_AND_PAID",
        data: { method, amount: total, tip },
      });

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-orders"] });
    },
  });
}
