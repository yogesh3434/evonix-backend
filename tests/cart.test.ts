/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as cartRepository from '../src/repositories/cartRepository';
import { VehicleStatus } from '../src/entities/Vehicle';

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

const mockedRepo = cartRepository as jest.Mocked<typeof cartRepository>;

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CART_ID = '22222222-2222-2222-2222-222222222222';
const VALID_VEHICLE_ID = 'c5c21f34-528b-4736-bbd7-4a670728abfc';
const MISSING_VEHICLE_ID = '00000000-0000-4000-8000-000000000000';

const cart = {
    id: CART_ID,
    userId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const vehicle = (overrides: Record<string, unknown> = {}) =>
    ({
        id: VALID_VEHICLE_ID,
        name: 'Model Y Long Range',
        brand: 'Tesla',
        model: 'Model Y',
        price: '99000.00',
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
        vehicleId: VALID_VEHICLE_ID,
        quantity: 1,
        unitPrice: '99000.00',
        customizationTotal: '0.00',
        addedAt: new Date(),
        ...overrides,
    }) as any;

describe('Cart API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedRepo.findCartByUser.mockResolvedValue(cart);
    });

    it('TC-023: adds a vehicle to the cart and returns the updated total', async () => {
        mockedRepo.findAvailableVehicle.mockResolvedValue(vehicle());
        mockedRepo.findCartItem.mockResolvedValue(null);
        mockedRepo.saveCartItem.mockResolvedValue(cartItem({ quantity: 2 }));
        mockedRepo.findCartItems.mockResolvedValue([cartItem({ quantity: 2 })]);
        mockedRepo.findVehiclesByIds.mockResolvedValue([vehicle()]);

        const response = await request(app).post('/api/cart/items').send({
            vehicleId: VALID_VEHICLE_ID,
            quantity: 2,
        });

        expect(response.status).toBe(201);
        expect(response.body.data.itemCount).toBe(2);
        expect(response.body.data.subtotal).toBe(198000);
        expect(mockedRepo.saveCartItem).toHaveBeenCalled();
    });

    it('TC-024: refuses to add more vehicles than are in stock', async () => {
        mockedRepo.findAvailableVehicle.mockResolvedValue(
            vehicle({ quantity: 2 })
        );
        mockedRepo.findCartItem.mockResolvedValue(null);

        const response = await request(app).post('/api/cart/items').send({
            vehicleId: VALID_VEHICLE_ID,
            quantity: 5,
        });

        expect(response.status).toBe(409);
        expect(mockedRepo.saveCartItem).not.toHaveBeenCalled();
    });

    it('TC-025: returns 404 when the vehicle does not exist', async () => {
        mockedRepo.findAvailableVehicle.mockResolvedValue(null);

        const response = await request(app).post('/api/cart/items').send({
            vehicleId: MISSING_VEHICLE_ID,
            quantity: 1,
        });

        expect(response.status).toBe(404);
        expect(mockedRepo.saveCartItem).not.toHaveBeenCalled();
    });

    it('TC-026: removes a vehicle and recalculates the cart total', async () => {
        mockedRepo.findCartItem.mockResolvedValue(cartItem());
        mockedRepo.deleteCartItem.mockResolvedValue(undefined);
        mockedRepo.findCartItems.mockResolvedValue([]);
        mockedRepo.findVehiclesByIds.mockResolvedValue([]);

        const response = await request(app).delete(
            `/api/cart/items/${VALID_VEHICLE_ID}`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.items).toHaveLength(0);
        expect(response.body.data.subtotal).toBe(0);
        expect(mockedRepo.deleteCartItem).toHaveBeenCalled();
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});