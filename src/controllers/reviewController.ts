import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../middleware/authMiddleware';
import { getVehicleReviews, submitReview } from '../services/reviewService';
import {
    parseCreateReview,
    parseVehicleIdParam,
} from '../validators/reviewValidator';

export const postReview = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const input = parseCreateReview(req.body);
        const review = await submitReview(user.id, input);

        res.status(201).json({
            success: true,
            data: review,
        });
    } catch (error) {
        next(error);
    }
};

export const getReviewsForVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const vehicleId = parseVehicleIdParam(req.params);
        const result = await getVehicleReviews(vehicleId);

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};