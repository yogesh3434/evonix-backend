import { EventBus } from './eventBus';

export type OrderCompletedPayload = {
    orderId: string;
    userId: string;
    cartId: string | null;
    total: number;
    items: {
        vehicleId: string;
        quantity: number;
        unitPrice: number;
    }[];
};

export type OrderPaymentDeniedPayload = {
    orderId: string;
    userId: string;
    attemptNumber: number;
};

export type OrderEvents = {
    orderCompleted: OrderCompletedPayload;
    orderPaymentDenied: OrderPaymentDeniedPayload;
};

/**
 * The single subject the Ordering service publishes to. The Catalog, Analytics
 * and Cart services subscribe to it in orderSubscribers.ts.
 */
export const orderEvents = new EventBus<OrderEvents>();
