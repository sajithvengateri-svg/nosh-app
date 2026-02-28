// TODO: Implement Order types
export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}
