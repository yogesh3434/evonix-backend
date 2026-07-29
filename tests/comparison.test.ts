import { compareVehicles } from '../src/services/vehicleService';
import * as vehicleRepository from '../src/repositories/vehicleRepository';
import { AppError } from '../src/errors/AppError';

jest.mock('../src/repositories/vehicleRepository');

const mockedRepo = vehicleRepository as jest.Mocked<typeof vehicleRepository>;

const makeVehicle = (id: string, name: string) =>
    ({
        id,
        vin: null,
        name,
        description: null,
        brand: 'Tesla',
        model: 'Model X',
        modelYear: 2024,
        condition: 'new',
        status: 'available',
        bodyStyle: 'SUV',
        colourExterior: null,
        colourInterior: null,
        interiorFabric: null,
        rangeKm: 560,
        batteryKwh: '100',
        chargeTimeHrs: null,
        horsepower: 670,
        seatingCapacity: 7,
        price: '87000',
        mileageKm: 0,
        quantity: 5,
        isHotDeal: false,
        hotDealPrice: null,
        isActive: true,
    }) as any;

const ID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ID_MISSING = '00000000-0000-4000-8000-000000000000';

describe('Vehicle Comparison', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('TC-042: returns both vehicles when all IDs exist', async () => {
        mockedRepo.findVehicleById.mockImplementation(async (id: string) => {
            if (id === ID_A) return makeVehicle(ID_A, 'Tesla Model X');
            if (id === ID_B) return makeVehicle(ID_B, 'Tesla Model Y');
            return null;
        });

        const result = await compareVehicles([ID_A, ID_B]);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Tesla Model X');
        expect(result[1].name).toBe('Tesla Model Y');
    });

    it('TC-043: throws 404 when a vehicle does not exist', async () => {
        mockedRepo.findVehicleById.mockImplementation(async (id: string) => {
            if (id === ID_A) return makeVehicle(ID_A, 'Tesla Model X');
            return null;
        });

        await expect(compareVehicles([ID_A, ID_MISSING])).rejects.toThrow(
            AppError
        );
    });
});