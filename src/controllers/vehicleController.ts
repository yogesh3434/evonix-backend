import { NextFunction, Request, Response } from 'express';
import {
    compareVehicles,
    getHotDeals,
    getVehicle,
    getVehicles,
} from '../services/vehicleService';
import {
    parseCompareQuery,
    parseVehicleQuery,
} from '../validators/vehicleValidator';

export const listVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const query = parseVehicleQuery(req.query);
        const result = await getVehicles(query);

        res.status(200).json({
            success: true,
            count: result.data.length,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            data: result.data,
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

export const compareVehiclesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ids = parseCompareQuery(req.query);
        const vehicles = await compareVehicles(ids);

        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles,
        });
    } catch (error) {
        next(error);
    }
};