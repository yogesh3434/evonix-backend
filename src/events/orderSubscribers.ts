import { UsageEventType } from '../entities/UsageEvent';
import { getCartItemRepository } from '../repositories/cartRepository';
import { decrementVehicleQuantity } from '../repositories/orderRepository';
import { saveUsageEvent } from '../repositories/reportRepository';
import { orderEvents, OrderCompletedPayload } from './orderEvents';

export const onOrderCompletedUpdateCatalog = async (
    payload: OrderCompletedPayload
): Promise<void> => {
    for (const item of payload.items) {
        const decremented = await decrementVehicleQuantity(
            item.vehicleId,
            item.quantity
        );

        if (!decremented) {
            console.error(
                `Order ${payload.orderId}: could not reduce stock for vehicle ${item.vehicleId} by ${item.quantity}`
            );
        }
    }
};

export const onOrderCompletedRecordAnalytics = async (
    payload: OrderCompletedPayload
): Promise<void> => {
    for (const item of payload.items) {
        await saveUsageEvent({
            userId: payload.userId,
            vehicleId: item.vehicleId,
            eventType: UsageEventType.PURCHASE,
        });
    }
};

export const onOrderCompletedClearCart = async (
    payload: OrderCompletedPayload
): Promise<void> => {
    if (!payload.cartId) {
        return;
    }

    await getCartItemRepository().delete({ cartId: payload.cartId });
};

export const registerOrderSubscribers = (): void => {
    orderEvents.subscribe('orderCompleted', onOrderCompletedUpdateCatalog);
    orderEvents.subscribe('orderCompleted', onOrderCompletedRecordAnalytics);
    orderEvents.subscribe('orderCompleted', onOrderCompletedClearCart);

    orderEvents.subscribe('orderPaymentDenied', (payload) => {
        console.warn(
            `Order ${payload.orderId}: payment attempt ${payload.attemptNumber} was declined`
        );
    });
};
