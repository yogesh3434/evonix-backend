import { Vehicle } from '../entities/Vehicle';
import {
    findVehicles,
    findHotDealVehicles,
    findVehicleById,
} from '../repositories/vehicleRepository';
import { AppError } from '../errors/AppError';
import { PaginatedResult, VehicleQuery } from '../types/vehicle';

export type VehicleResponse = {
    id: string;
    vin: string | null;
    name: string;
    description: string | null;
    brand: string;
    model: string;
    modelYear: number;
    condition: string;
    status: string;
    bodyStyle: string | null;
    colourExterior: string | null;
    colourInterior: string | null;
    interiorFabric: string | null;
    rangeKm: number | null;
    batteryKwh: number | null;
    chargeTimeHrs: number | null;
    horsepower: number | null;
    seatingCapacity: number | null;
    price: number;
    mileageKm: number;
    quantity: number;
    isHotDeal: boolean;
    hotDealPrice: number | null;
    isActive: boolean;
};

const mapVehicleResponse = (vehicle: Vehicle): VehicleResponse => ({
    id: vehicle.id,
    vin: vehicle.vin,
    name: vehicle.name,
    description: vehicle.description,
    brand: vehicle.brand,
    model: vehicle.model,
    modelYear: vehicle.modelYear,
    condition: vehicle.condition,
    status: vehicle.status,
    bodyStyle: vehicle.bodyStyle,
    colourExterior: vehicle.colourExterior,
    colourInterior: vehicle.colourInterior,
    interiorFabric: vehicle.interiorFabric,
    rangeKm: vehicle.rangeKm,
    batteryKwh:
        vehicle.batteryKwh === null ? null : Number(vehicle.batteryKwh),
    chargeTimeHrs:
        vehicle.chargeTimeHrs === null ? null : Number(vehicle.chargeTimeHrs),
    horsepower: vehicle.horsepower,
    seatingCapacity: vehicle.seatingCapacity,
    price: Number(vehicle.price),
    mileageKm: vehicle.mileageKm,
    quantity: vehicle.quantity,
    isHotDeal: vehicle.isHotDeal,
    hotDealPrice:
        vehicle.hotDealPrice === null ? null : Number(vehicle.hotDealPrice),
    isActive: vehicle.isActive,
});

export const getVehicles = async (
    query: VehicleQuery
): Promise<PaginatedResult<VehicleResponse>> => {
    const result = await findVehicles(query);

    return {
        data: result.data.map(mapVehicleResponse),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
    };
};

export const getVehicle = async (
    id: string
): Promise<VehicleResponse> => {
    const vehicle = await findVehicleById(id);

    if (!vehicle) {
        throw new AppError(404, 'Vehicle not found');
    }

    return mapVehicleResponse(vehicle);
};

export const getHotDeals = async (): Promise<VehicleResponse[]> => {
    const vehicles = await findHotDealVehicles();
    return vehicles.map(mapVehicleResponse);
};

export const compareVehicles = async (
    ids: string[]
): Promise<VehicleResponse[]> => {
    const vehicles: VehicleResponse[] = [];

    for (const id of ids) {
        const vehicle = await findVehicleById(id);

        if (!vehicle) {
            throw new AppError(404, `Vehicle not found: ${id}`);
        }

        vehicles.push(mapVehicleResponse(vehicle));
    }

    return vehicles;
};