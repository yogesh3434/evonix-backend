import { UsageEventType } from '../entities/UsageEvent';
import { getCartItemRepository } from '../repositories/cartRepository';
import { decrementVehicleQuantity } from '../repositories/orderRepository';
import { saveUsageEvent } from '../repositories/reportRepository';
import { orderEvents, OrderCompletedPayload } from './orderEvents';

/**
 * The observers of the orderCompleted event.
 *
 * Each function belongs conceptually to a different service. None of them is
 * known to the Ordering service, and adding a fourth reaction (a confirmation
 * email, a loyalty credit) means adding a subscriber here and changing no
 * existing code. That is the low-coupling claim in our design rationale, made
 * good in the implementation.
 */

/**
 * Catalog service: reduce the stock of every vehicle that was bought, and mark a
 * vehicle sold once nothing is left.
 */
export const onOrderCompletedUpdateCatalog = async (
    payload: OrderCompletedPayload
): Promise<void> => {
    for (const item of payload.items) {
        const decremented = await decrementVehicleQuantity(
            item.vehicleId,
            item.quantity
        );

        if (!decremented) {
            // The payment has already been captured, so this is not something
            // the customer can be asked to fix. It is logged for staff to
            // reconcile against the order.
            console.error(
                `Order ${payload.orderId}: could not reduce stock for vehicle ${item.vehicleId} by ${item.quantity}`
            );
        }
    }
};

/**
 * Analytics service: record one purchase event per vehicle so the administrator
 * sales and usage reports have something to aggregate.
 */
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

/**
 * Cart service: empty the cart that produced the order.
 */
export const onOrderCompletedClearCart = async (
    payload: OrderCompletedPayload
): Promise<void> => {
    if (!payload.cartId) {
        return;
    }

    await getCartItemRepository().delete({ cartId: payload.cartId });
};

/**
 * Wire the observers to the subject. Called once from server.ts at startup, and
 * directly from the tests that assert on observer behaviour.
 */
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
