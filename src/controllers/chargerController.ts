import { NextFunction, Request, Response } from 'express';
import { estimateChargerInstallation } from '../services/chargerService';
import { parseChargerQuery } from '../validators/chargerValidator';

export const getChargerEstimate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { propertyType, chargerLevel, distanceToPanel } =
            parseChargerQuery(req.query);

        const estimate = estimateChargerInstallation(
            propertyType,
            chargerLevel,
            distanceToPanel
        );

        res.status(200).json({ success: true, data: estimate });
    } catch (error) {
        next(error);
    }
};