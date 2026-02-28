// TODO: Implement Payment types
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'eftpos' | 'online';

export type RefundReason = 'customer-request' | 'quality-issue' | 'wrong-order' | 'other';
