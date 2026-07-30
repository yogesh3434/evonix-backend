import { NextFunction, Request, Response } from 'express';
import { getVehicleCustomizations } from '../services/customizationService';
import { parseCustomizationVehicleId } from '../validators/customizationValidator';

// UC11: the customization options available for one vehicle.
export const listVehicleCustomizations = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const vehicleId = parseCustomizationVehicleId(req.params);
        const customizations = await getVehicleCustomizations(vehicleId);

        res.status(200).json({
            success: true,
            data: customizations,
        });
    } catch (error) {
        next(error);
    }
};
