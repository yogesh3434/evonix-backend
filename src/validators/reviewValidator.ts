import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { CreateReviewInput } from '../types/review';

const createReviewSchema = z.object({
    vehicleId: z.string().uuid(),

    rating: z.coerce.number().int().min(1).max(5),

    title: z.string().trim().min(1).max(120).optional(),

    body: z.string().trim().min(1).max(2000).optional(),
});

const vehicleIdParamSchema = z.object({
    vehicleId: z.string().uuid(),
});

export const parseCreateReview = (body: unknown): CreateReviewInput => {
    const result = createReviewSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(400, 'Invalid review data', result.error.flatten());
    }

    return result.data;
};

export const parseVehicleIdParam = (params: unknown): string => {
    const result = vehicleIdParamSchema.safeParse(params);

    if (!result.success) {
        throw new AppError(400, 'Invalid vehicle ID', result.error.flatten());
    }

    return result.data.vehicleId;
};