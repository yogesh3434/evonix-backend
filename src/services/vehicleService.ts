import { Vehicle } from '../entities/Vehicle';
import {
    findAllActiveVehicles,
    findHotDealVehicles,
    findVehicleById,
} from '../repositories/vehicleRepository';
import { AppError } from '../errors/AppError';

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

export const getVehicles = async (): Promise<VehicleResponse[]> => {
    const vehicles = await findAllActiveVehicles();
    return vehicles.map(mapVehicleResponse);
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