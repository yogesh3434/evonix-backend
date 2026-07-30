/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as cartRepository from '../src/repositories/cartRepository';
import * as orderRepository from '../src/repositories/orderRepository';
import * as reportRepository from '../src/repositories/reportRepository';
import { OrderStatus, PaymentStatus } from '../src/entities/Order';
import { VehicleStatus } from '../src/entities/Vehicle';
import { orderEvents } from '../src/events/orderEvents';
import { registerOrderSubscribers } from '../src/events/orderSubscribers';
import { resetPaymentSequence } from '../src/services/paymentService';

jest.mock('../src/middleware/authMiddleware', () => ({
    requireAuth: (_req: any, res: any, next: any) => {
        res.locals.user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'test@example.com',
        };
        next();
    },
}));

jest.mock('../src/repositories/cartRepository');
jest.mock('../src/repositories/orderRepository');
jest.mock('../src/repositories/reportRepository');

const mockedCartRepo = cartRepository as jest.Mocked<typeof cartRepository>;
const mockedOrderRepo = orderRepository as jest.Mocked<typeof orderRepository>;
const mockedReportRepo = reportRepository as jest.Mocked<
    typeof reportRepository
>;

const cartItemRepositoryDouble = { delete: jest.fn() };

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CART_ID = '22222222-2222-2222-2222-222222222222';
const ORDER_ID = '44444444-4444-4444-8444-444444444444';
const VEHICLE_ID = 'c5c21f34-528b-4736-bbd7-4a670728abfc';

const cart = {
    id: CART_ID,
    userId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const vehicle = (overrides: Record<string, unknown> = {}) =>
    ({
        id: VEHICLE_ID,
        name: 'Model Y Long Range',
        brand: 'Tesla',
        model: 'Model Y',
        price: '50000.00',
        quantity: 3,
        isHotDeal: false,
        hotDealPrice: null,
        isActive: true,
        status: VehicleStatus.AVAILABLE,
        ...overrides,
    }) as any;

const cartItem = (overrides: Record<string, unknown> = {}) =>
    ({
        id: '33333333-3333-3333-3333-333333333333',
        cartId: CART_ID,
        vehicleId: VEHICLE_ID,
        quantity: 1,
        unitPrice: '50000.00',
        customizationOptions: [],
        customizationTotal: '0.00',
        addedAt: new Date(),
        ...overrides,
    }) as any;

const order = (overrides: Record<string, unknown> = {}) =>
    ({
        id: ORDER_ID,
        userId: USER_ID,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: '50000.00',
        tax: '6500.00',
        total: '56500.00',
        shippingName: 'Amr Alhamwi',
        shippingStreet: '1 Yonge Street',
        shippingCity: 'Toronto',
        shippingProvince: 'Ontario',
        shippingCountry: 'Canada',
        shippingPostalCode: 'M5E 1E5',
        shippingPhone: null,
        cardLastFour: '1111',
        cardHolderName: 'Amr Alhamwi',
        paymentAttemptSeq: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as any;

const orderItem = (overrides: Record<string, unknown> = {}) =>
    ({
        id: '55555555-5555-5555-5555-555555555555',
        orderId: ORDER_ID,
        vehicleId: VEHICLE_ID,
        quantity: 1,
        unitPrice: '50000.00',
        customizationOptions: [],
        customizationTotal: '0.00',
        ...overrides,
    }) as any;

const checkoutBody = {
    shipping: {
        fullName: 'Amr Alhamwi',
        street: '1 Yonge Street',
        city: 'Toronto',
        province: 'Ontario',
        country: 'Canada',
        postalCode: 'M5E 1E5',
    },
    payment: {
        cardNumber: '4111 1111 1111 1111',
        cardHolderName: 'Amr Alhamwi',
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 2,
        cvv: '123',
    },
};

describe('Orders API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        orderEvents.clear();
        resetPaymentSequence();

        mockedCartRepo.findCartByUser.mockResolvedValue(cart);
        mockedCartRepo.findCartItems.mockResolvedValue([cartItem()]);
        mockedOrderRepo.findVehiclesByIds.mockResolvedValue([vehicle()]);
        mockedOrderRepo.saveOrder.mockResolvedValue(order());
        mockedOrderRepo.saveOrderItems.mockResolvedValue([orderItem()]);
        mockedOrderRepo.findOrderItems.mockResolvedValue([orderItem()]);
        mockedOrderRepo.countPaymentAttempts.mockResolvedValue(0);
        mockedOrderRepo.savePaymentAttempt.mockResolvedValue({} as any);
        mockedOrderRepo.updateOrderPayment.mockResolvedValue(undefined);
        mockedOrderRepo.decrementVehicleQuantity.mockResolvedValue(true);
        mockedReportRepo.saveUsageEvent.mockResolvedValue(undefined);
        cartItemRepositoryDouble.delete.mockReset();
        cartItemRepositoryDouble.delete.mockResolvedValue({ affected: 1 });
        mockedCartRepo.getCartItemRepository.mockReturnValue(
            cartItemRepositoryDouble as any
        );
        mockedOrderRepo.findOrderById.mockResolvedValue(
            order({
                status: OrderStatus.PROCESSED,
                paymentStatus: PaymentStatus.APPROVED,
                paymentAttemptSeq: 1,
            })
        );
    });

    it('TC-031: completes checkout, charges tax and returns a processed order', async () => {
        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(201);
        expect(response.body.data.paymentStatus).toBe('approved');
        expect(response.body.data.status).toBe('processed');
        expect(response.body.data.subtotal).toBe(50000);
        expect(response.body.data.tax).toBe(6500);
        expect(response.body.data.total).toBe(56500);

        const savedOrder = mockedOrderRepo.saveOrder.mock.calls[0][0];
        expect(savedOrder.cardLastFour).toBe('1111');
        expect(JSON.stringify(savedOrder)).not.toContain('4111111111111111');
    });

    it('TC-032: rejects checkout when the cart is empty', async () => {
        mockedCartRepo.findCartItems.mockResolvedValue([]);

        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(400);
        expect(mockedOrderRepo.saveOrder).not.toHaveBeenCalled();
    });

    it('TC-033: rejects checkout when the cart holds more units than are in stock', async () => {
        mockedCartRepo.findCartItems.mockResolvedValue([
            cartItem({ quantity: 5 }),
        ]);
        mockedOrderRepo.findVehiclesByIds.mockResolvedValue([
            vehicle({ quantity: 2 }),
        ]);

        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(409);
        expect(mockedOrderRepo.saveOrder).not.toHaveBeenCalled();
    });

    it('TC-034: declines the third consecutive payment request and denies the order', async () => {
        await request(app).post('/api/orders').send(checkoutBody);
        await request(app).post('/api/orders').send(checkoutBody);

        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(402);
        expect(response.body.success).toBe(false);
        expect(response.body.details.orderId).toBe(ORDER_ID);

        const updateCalls = mockedOrderRepo.updateOrderPayment.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1];
        expect(lastUpdate[1]).toMatchObject({
            status: OrderStatus.DENIED,
            paymentStatus: PaymentStatus.DENIED,
        });
        expect(mockedOrderRepo.savePaymentAttempt).toHaveBeenCalledTimes(3);
    });

    it('TC-035: an approved order notifies the catalog, analytics and cart observers', async () => {
        registerOrderSubscribers();

        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(201);

        expect(mockedOrderRepo.decrementVehicleQuantity).toHaveBeenCalledWith(
            VEHICLE_ID,
            1
        );

        expect(mockedReportRepo.saveUsageEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: USER_ID,
                vehicleId: VEHICLE_ID,
                eventType: 'purchase',
            })
        );

        expect(cartItemRepositoryDouble.delete).toHaveBeenCalledWith({
            cartId: CART_ID,
        });
    });

    it('TC-036: a declined payment leaves stock and the cart untouched', async () => {
        registerOrderSubscribers();

        await request(app).post('/api/orders').send(checkoutBody);
        await request(app).post('/api/orders').send(checkoutBody);
        jest.clearAllMocks();
        mockedCartRepo.findCartByUser.mockResolvedValue(cart);
        mockedCartRepo.findCartItems.mockResolvedValue([cartItem()]);
        mockedOrderRepo.findVehiclesByIds.mockResolvedValue([vehicle()]);
        mockedOrderRepo.saveOrder.mockResolvedValue(order());
        mockedOrderRepo.findOrderItems.mockResolvedValue([orderItem()]);
        mockedOrderRepo.countPaymentAttempts.mockResolvedValue(0);
        mockedCartRepo.getCartItemRepository.mockReturnValue(
            cartItemRepositoryDouble as any
        );

        const response = await request(app)
            .post('/api/orders')
            .send(checkoutBody);

        expect(response.status).toBe(402);
        expect(mockedOrderRepo.decrementVehicleQuantity).not.toHaveBeenCalled();
        expect(mockedReportRepo.saveUsageEvent).not.toHaveBeenCalled();
    });

    it("TC-037: returns 404 rather than another customer's order", async () => {
        mockedOrderRepo.findOrderById.mockResolvedValue(
            order({ userId: '99999999-9999-4999-8999-999999999999' })
        );

        const response = await request(app).get(`/api/orders/${ORDER_ID}`);

        expect(response.status).toBe(404);
    });
});

afterAll(async () => {
    orderEvents.clear();

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});
