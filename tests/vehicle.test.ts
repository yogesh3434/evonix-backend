/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as vehicleRepository from '../src/repositories/vehicleRepository';
import {
    VehicleCondition,
    VehicleStatus,
} from '../src/entities/Vehicle';

jest.mock('../src/repositories/vehicleRepository');

const mockedRepo =
    vehicleRepository as jest.Mocked<typeof vehicleRepository>;

const VEHICLE_ID = 'c5c21f34-528b-4736-bbd7-4a670728abfc';
const MISSING_VEHICLE_ID =
    '00000000-0000-4000-8000-000000000000';

const vehicle = (overrides: Record<string, unknown> = {}) =>
    ({
        id: VEHICLE_ID,
        vin: '5YJYGDEE9MF123456',
        name: 'Model Y Long Range',
        description: 'Electric SUV with long range.',
        brand: 'Tesla',
        model: 'Model Y',
        modelYear: 2024,
        condition: VehicleCondition.NEW,
        status: VehicleStatus.AVAILABLE,
        bodyStyle: 'SUV',
        colourExterior: 'White',
        colourInterior: 'Black',
        interiorFabric: 'Vegan Leather',
        rangeKm: 525,
        batteryKwh: '81.00',
        chargeTimeHrs: '8.00',
        horsepower: 384,
        seatingCapacity: 5,
        price: '69000.00',
        mileageKm: 50,
        quantity: 3,
        isHotDeal: false,
        hotDealPrice: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as any;

describe('Vehicles API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('TC-032: returns all available vehicles', async () => {
        mockedRepo.findVehicles.mockResolvedValue({
            data: [vehicle()],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
        });

        const response = await request(app).get('/api/vehicles');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(response.body.data[0].brand).toBe('Tesla');
        expect(response.body.data[0].price).toBe(69000);
        expect(mockedRepo.findVehicles).toHaveBeenCalled();
    });

    it('TC-033: passes filter and sorting options to the repository', async () => {
        mockedRepo.findVehicles.mockResolvedValue({
            data: [vehicle()],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
        });

        const response = await request(app).get(
            '/api/vehicles?brand=Tesla&condition=new&sortBy=price&sortOrder=asc'
        );

        expect(response.status).toBe(200);

        expect(mockedRepo.findVehicles).toHaveBeenCalledWith(
            expect.objectContaining({
                brand: 'Tesla',
                condition: 'new',
                sortBy: 'price',
                sortOrder: 'asc',
                page: 1,
                limit: 12,
            })
        );
    });

    it('TC-034: returns the details of an existing vehicle', async () => {
        mockedRepo.findVehicleById.mockResolvedValue(vehicle());

        const response = await request(app).get(
            `/api/vehicles/${VEHICLE_ID}`
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(VEHICLE_ID);
        expect(response.body.data.name).toBe(
            'Model Y Long Range'
        );

        expect(mockedRepo.findVehicleById).toHaveBeenCalledWith(
            VEHICLE_ID
        );
    });

    it('TC-035: returns 404 when the vehicle does not exist', async () => {
        mockedRepo.findVehicleById.mockResolvedValue(null);

        const response = await request(app).get(
            `/api/vehicles/${MISSING_VEHICLE_ID}`
        );

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Vehicle not found');
    });

    it('TC-036: returns available hot-deal vehicles', async () => {
        mockedRepo.findHotDealVehicles.mockResolvedValue([
            vehicle({
                isHotDeal: true,
                hotDealPrice: '62000.00',
            }),
        ]);

        const response = await request(app).get(
            '/api/vehicles/hot-deals'
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(response.body.data[0].isHotDeal).toBe(true);
        expect(response.body.data[0].hotDealPrice).toBe(62000);
    });

    it('TC-037: rejects invalid vehicle filter parameters', async () => {
        const response = await request(app).get(
            '/api/vehicles?modelYear=1800'
        );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(mockedRepo.findVehicles).not.toHaveBeenCalled();
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});