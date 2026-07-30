/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as customizationRepository from '../src/repositories/customizationRepository';
import * as vehicleRepository from '../src/repositories/vehicleRepository';
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

jest.mock('../src/repositories/customizationRepository');
jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/cartRepository');

const mockedCustomizationRepo =
    customizationRepository as jest.Mocked<typeof customizationRepository>;
const mockedVehicleRepo = vehicleRepository as jest.Mocked<
    typeof vehicleRepository
>;
const mockedCartRepo = cartRepository as jest.Mocked<typeof cartRepository>;

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CART_ID = '22222222-2222-4222-8222-222222222222';
const VEHICLE_ID = 'c5c21f34-528b-4736-bbd7-4a670728abfc';
const PAINT_OPTION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const WHEEL_OPTION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const FOREIGN_OPTION_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

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

const offeredOptions = (overrides: Record<string, unknown>[] = []) =>
    [
        {
            id: PAINT_OPTION_ID,
            categoryId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            categoryName: 'Exterior Colour',
            name: 'Pearl White',
            priceDelta: '1200.00',
            isAvailable: true,
        },
        {
            id: WHEEL_OPTION_ID,
            categoryId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            categoryName: 'Wheel Package',
            name: '21-inch Sport Wheels',
            priceDelta: '3000.00',
            isAvailable: true,
        },
        ...overrides,
    ] as any[];

const cart = {
    id: CART_ID,
    userId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

describe('Vehicle customization API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedVehicleRepo.findVehicleById.mockResolvedValue(vehicle());
        mockedCustomizationRepo.findOptionsForVehicle.mockResolvedValue(
            offeredOptions()
        );
        mockedCustomizationRepo.findOptionIdsForVehicle.mockResolvedValue([
            PAINT_OPTION_ID,
            WHEEL_OPTION_ID,
        ]);
        mockedCartRepo.findCartByUser.mockResolvedValue(cart);
    });

    it('TC-038: lists the options a vehicle offers, grouped by category', async () => {
        const response = await request(app).get(
            `/api/vehicles/${VEHICLE_ID}/customizations`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.basePrice).toBe(50000);
        expect(response.body.data.categories).toHaveLength(2);
        expect(response.body.data.categories[0].name).toBe('Exterior Colour');
        expect(response.body.data.categories[0].options[0].priceDelta).toBe(
            1200
        );
    });

    it('TC-039: adds a configured vehicle to the cart and prices the options into the line total', async () => {
        mockedCustomizationRepo.findOptionsByIds.mockResolvedValue(
            offeredOptions()
        );
        mockedCartRepo.findAvailableVehicle.mockResolvedValue(vehicle());
        mockedCartRepo.findCartItem.mockResolvedValue(null);
        mockedCartRepo.saveCartItem.mockResolvedValue({} as any);
        mockedCartRepo.findCartItems.mockResolvedValue([
            {
                id: '33333333-3333-4333-8333-333333333333',
                cartId: CART_ID,
                vehicleId: VEHICLE_ID,
                quantity: 1,
                unitPrice: '50000.00',
                customizationOptions: [
                    {
                        optionId: PAINT_OPTION_ID,
                        name: 'Pearl White',
                        category: 'Exterior Colour',
                        priceDelta: 1200,
                    },
                    {
                        optionId: WHEEL_OPTION_ID,
                        name: '21-inch Sport Wheels',
                        category: 'Wheel Package',
                        priceDelta: 3000,
                    },
                ],
                customizationTotal: '4200.00',
                addedAt: new Date(),
            } as any,
        ]);
        mockedCartRepo.findVehiclesByIds.mockResolvedValue([vehicle()]);

        const response = await request(app)
            .post('/api/cart/items')
            .send({
                vehicleId: VEHICLE_ID,
                quantity: 1,
                customizationOptionIds: [PAINT_OPTION_ID, WHEEL_OPTION_ID],
            });

        expect(response.status).toBe(201);
        expect(response.body.data.items[0].customizationTotal).toBe(4200);
        expect(response.body.data.items[0].customizationOptions).toHaveLength(2);
        expect(response.body.data.subtotal).toBe(54200);

        const saved = mockedCartRepo.saveCartItem.mock.calls[0][0];
        expect(saved.customizationTotal).toBe('4200.00');
    });

    it('TC-040: refuses an option that is not offered on the selected vehicle', async () => {
        mockedCartRepo.findAvailableVehicle.mockResolvedValue(vehicle());
        mockedCartRepo.findCartItem.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/cart/items')
            .send({
                vehicleId: VEHICLE_ID,
                quantity: 1,
                customizationOptionIds: [FOREIGN_OPTION_ID],
            });

        expect(response.status).toBe(400);
        expect(mockedCartRepo.saveCartItem).not.toHaveBeenCalled();
    });

    it('TC-041: refuses an option that has been withdrawn', async () => {
        mockedCustomizationRepo.findOptionsByIds.mockResolvedValue([
            offeredOptions()[0],
            { ...offeredOptions()[1], isAvailable: false },
        ] as any);
        mockedCartRepo.findAvailableVehicle.mockResolvedValue(vehicle());
        mockedCartRepo.findCartItem.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/cart/items')
            .send({
                vehicleId: VEHICLE_ID,
                quantity: 1,
                customizationOptionIds: [PAINT_OPTION_ID, WHEEL_OPTION_ID],
            });

        expect(response.status).toBe(409);
        expect(mockedCartRepo.saveCartItem).not.toHaveBeenCalled();
    });

    it('TC-042: keeps the configuration when only the quantity changes', async () => {
        const existing = {
            id: '33333333-3333-4333-8333-333333333333',
            cartId: CART_ID,
            vehicleId: VEHICLE_ID,
            quantity: 1,
            unitPrice: '50000.00',
            customizationOptions: [
                {
                    optionId: PAINT_OPTION_ID,
                    name: 'Pearl White',
                    category: 'Exterior Colour',
                    priceDelta: 1200,
                },
            ],
            customizationTotal: '1200.00',
            addedAt: new Date(),
        } as any;

        mockedCartRepo.findCartItem.mockResolvedValue(existing);
        mockedCartRepo.findAvailableVehicle.mockResolvedValue(vehicle());
        mockedCartRepo.saveCartItem.mockResolvedValue(existing);
        mockedCartRepo.findCartItems.mockResolvedValue([
            { ...existing, quantity: 2 },
        ]);
        mockedCartRepo.findVehiclesByIds.mockResolvedValue([vehicle()]);

        const response = await request(app)
            .patch(`/api/cart/items/${VEHICLE_ID}`)
            .send({ quantity: 2 });

        expect(response.status).toBe(200);

        const saved = mockedCartRepo.saveCartItem.mock.calls[0][0];
        expect(saved.customizationTotal).toBe('1200.00');
        expect(saved.customizationOptions).toHaveLength(1);

        // (50000 + 1200) * 2
        expect(response.body.data.subtotal).toBe(102400);
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});
