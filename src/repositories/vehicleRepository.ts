import { AppDataSource } from '../config/datasource';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';

export const getVehicleRepository = () =>
    AppDataSource.getRepository(Vehicle);

export const findAllActiveVehicles = async (): Promise<Vehicle[]> => {
    return getVehicleRepository().find({
        where: {
            isActive: true,
            status: VehicleStatus.AVAILABLE,
        },
        order: {
            createdAt: 'DESC',
        },
    });
};

export const findVehicleById = async (
    id: string
): Promise<Vehicle | null> => {
    return getVehicleRepository().findOne({
        where: {
            id,
            isActive: true,
        },
    });
};

export const findHotDealVehicles = async (): Promise<Vehicle[]> => {
    return getVehicleRepository().find({
        where: {
            isActive: true,
            isHotDeal: true,
            status: VehicleStatus.AVAILABLE,
        },
        order: {
            hotDealPrice: 'ASC',
        },
    });
};