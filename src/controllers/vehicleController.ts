import { NextFunction, Request, Response } from 'express';
import {
    getHotDeals,
    getVehicle,
    getVehicles,
} from '../services/vehicleService';

export const listVehicles = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const vehicles = await getVehicles();

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles,
        });
    } catch (error) {
        next(error);
    }
};

export const showVehicle = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const vehicle = await getVehicle(req.params.id);

        if (!vehicle) {
            res.status(404).json({
                success: false,
                message: 'Vehicle not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: vehicle,
        });
    } catch (error) {
        next(error);
    }
};

export const listHotDeals = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const vehicles = await getHotDeals();

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles,
        });
    } catch (error) {
        next(error);
    }
};