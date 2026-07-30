import { Order, OrderStatus, PaymentStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Vehicle } from '../entities/Vehicle';
import { AppError } from '../errors/AppError';
import { orderEvents } from '../events/orderEvents';
import {
    findCartByUser,
    findCartItems,
} from '../repositories/cartRepository';
import {
    countPaymentAttempts,
    findOrderById,
    findOrderItems,
    findOrdersByUser,
    findVehiclesByIds,
    savePaymentAttempt,
    saveOrder,
    saveOrderItems,
    updateOrderPayment,
} from '../repositories/orderRepository';
import {
    CheckoutInput,
    OrderItemResponse,
    OrderResponse,
} from '../types/order';
import {
    authorizePayment,
    maskCardNumber,
} from './paymentService';

/**
 * Ontario HST. Held in one place so a future province-aware tax rule replaces a
 * single constant rather than arithmetic scattered through the service.
 */
const TAX_RATE = 0.13;

const round = (value: number): number => Number(value.toFixed(2));

const mapOrderResponse = (
    order: Order,
    items: OrderItem[],
    vehicles: Vehicle[]
): OrderResponse => {
    const vehiclesById = new Map(
        vehicles.map((vehicle) => [vehicle.id, vehicle])
    );

    const mappedItems: OrderItemResponse[] = items.map((item) => {
        const vehicle = vehiclesById.get(item.vehicleId);
        const unitPrice = Number(item.unitPrice);
        const customizationTotal = Number(item.customizationTotal);

        return {
            id: item.id,
            vehicleId: item.vehicleId,
            name: vehicle?.name ?? '',
            brand: vehicle?.brand ?? '',
            model: vehicle?.model ?? '',
            quantity: item.quantity,
            unitPrice,
            customizationOptions: item.customizationOptions ?? [],
            customizationTotal,
            lineTotal: round((unitPrice + customizationTotal) * item.quantity),
        };
    });

    return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        cardLastFour: order.cardLastFour,
        shipping: {
            fullName: order.shippingName,
            street: order.shippingStreet,
            city: order.shippingCity,
            province: order.shippingProvince,
            country: order.shippingCountry,
            postalCode: order.shippingPostalCode,
            phone: order.shippingPhone,
        },
        items: mappedItems,
        createdAt: order.createdAt,
    };
};

const buildOrderResponse = async (order: Order): Promise<OrderResponse> => {
    const items = await findOrderItems(order.id);
    const vehicles = await findVehiclesByIds(
        items.map((item) => item.vehicleId)
    );

    return mapOrderResponse(order, items, vehicles);
};

/**
 * UC12: checkout and order processing.
 *
 * The order is written before the payment is attempted, so a declined payment
 * leaves an auditable record instead of vanishing. Stock is only released, the
 * cart only cleared and the sale only recorded once the payment is approved, and
 * all three of those happen through the orderCompleted event rather than inline
 * here. That is the Observer pattern doing its job: this function does not know
 * that the Catalog, Cart or Analytics services exist.
 */
export const checkout = async (
    userId: string,
    input: CheckoutInput
): Promise<OrderResponse> => {
    const cart = await findCartByUser(userId);

    if (!cart) {
        throw new AppError(400, 'Your cart is empty');
    }

    const cartItems = await findCartItems(cart.id);

    if (cartItems.length === 0) {
        throw new AppError(400, 'Your cart is empty');
    }

    const vehicles = await findVehiclesByIds(
        cartItems.map((item) => item.vehicleId)
    );

    const vehiclesById = new Map(
        vehicles.map((vehicle) => [vehicle.id, vehicle])
    );

    // Stock is re-checked at checkout. An item can sit in a cart for days, and
    // the quantity that was available when it was added proves nothing now.
    for (const item of cartItems) {
        const vehicle = vehiclesById.get(item.vehicleId);

        if (!vehicle || !vehicle.isActive) {
            throw new AppError(
                409,
                'A vehicle in your cart is no longer available'
            );
        }

        if (item.quantity > vehicle.quantity) {
            throw new AppError(
                409,
                `Only ${vehicle.quantity} of ${vehicle.name} are in stock`
            );
        }
    }

    const subtotal = round(
        cartItems.reduce((running, item) => {
            const lineTotal =
                (Number(item.unitPrice) + Number(item.customizationTotal)) *
                item.quantity;

            return running + lineTotal;
        }, 0)
    );

    const tax = round(subtotal * TAX_RATE);
    const total = round(subtotal + tax);

    const order = await saveOrder({
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        shippingName: input.shipping.fullName,
        shippingStreet: input.shipping.street,
        shippingCity: input.shipping.city,
        shippingProvince: input.shipping.province,
        shippingCountry: input.shipping.country,
        shippingPostalCode: input.shipping.postalCode,
        shippingPhone: input.shipping.phone ?? null,
        cardLastFour: maskCardNumber(input.payment.cardNumber),
        cardHolderName: input.payment.cardHolderName,
        notes: input.notes ?? null,
    });

    await saveOrderItems(
        cartItems.map((item) => ({
            orderId: order.id,
            vehicleId: item.vehicleId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            customizationOptions: item.customizationOptions ?? [],
            customizationTotal: item.customizationTotal,
        }))
    );

    return processPayment(order, cart.id, input.payment.cardNumber, input.payment.cardHolderName);
};

/**
 * Run a payment against an order and settle the order according to the result.
 * Shared by the initial checkout and by a retry after a decline.
 */
const processPayment = async (
    order: Order,
    cartId: string | null,
    cardNumber: string,
    cardHolderName: string
): Promise<OrderResponse> => {
    const total = Number(order.total);

    const payment = authorizePayment({
        orderId: order.id,
        amount: total,
        cardNumber,
        cardHolderName,
    });

    const previousAttempts = await countPaymentAttempts(order.id);
    const attemptNumber = previousAttempts + 1;

    await savePaymentAttempt({
        orderId: order.id,
        attemptNumber,
        result: payment.result,
    });

    if (payment.result === PaymentStatus.DENIED) {
        await updateOrderPayment(order.id, {
            status: OrderStatus.DENIED,
            paymentStatus: PaymentStatus.DENIED,
            paymentAttemptSeq: attemptNumber,
        });

        await orderEvents.publish('orderPaymentDenied', {
            orderId: order.id,
            userId: order.userId,
            attemptNumber,
        });

        throw new AppError(402, payment.message, {
            orderId: order.id,
            attemptNumber,
        });
    }

    await updateOrderPayment(order.id, {
        status: OrderStatus.PROCESSED,
        paymentStatus: PaymentStatus.APPROVED,
        paymentAttemptSeq: attemptNumber,
    });

    const items = await findOrderItems(order.id);

    // The single point at which the sale becomes final. Subscribers registered
    // in events/orderSubscribers.ts react to this.
    await orderEvents.publish('orderCompleted', {
        orderId: order.id,
        userId: order.userId,
        cartId,
        total,
        items: items.map((item) => ({
            vehicleId: item.vehicleId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
        })),
    });

    const settled = await findOrderById(order.id);

    return buildOrderResponse(settled ?? order);
};

/**
 * UC12: retry a payment on an order that was declined. Because the simulator
 * declines every third request, a customer will occasionally need this, and it
 * avoids making them rebuild a cart that has already been converted.
 */
export const retryOrderPayment = async (
    userId: string,
    orderId: string,
    cardNumber: string,
    cardHolderName: string
): Promise<OrderResponse> => {
    const order = await findOrderById(orderId);

    if (!order || order.userId !== userId) {
        throw new AppError(404, 'Order not found');
    }

    if (order.paymentStatus === PaymentStatus.APPROVED) {
        throw new AppError(409, 'This order has already been paid');
    }

    const cart = await findCartByUser(userId);

    return processPayment(order, cart?.id ?? null, cardNumber, cardHolderName);
};

export const getMyOrders = async (
    userId: string
): Promise<OrderResponse[]> => {
    const orders = await findOrdersByUser(userId);

    return Promise.all(orders.map((order) => buildOrderResponse(order)));
};

export const getMyOrder = async (
    userId: string,
    orderId: string
): Promise<OrderResponse> => {
    const order = await findOrderById(orderId);

    // A missing order and someone else's order return the same 404 on purpose.
    // Distinguishing them would confirm that an order ID exists.
    if (!order || order.userId !== userId) {
        throw new AppError(404, 'Order not found');
    }

    return buildOrderResponse(order);
};
