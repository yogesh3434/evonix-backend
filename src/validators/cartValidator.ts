import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { AddCartItemInput, UpdateCartItemInput } from '../types/cart';

const addCartItemSchema = z.object({
    vehicleId: z.string().uuid(),

    quantity: z.coerce.number().int().min(1).max(10).default(1),
});

const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().min(1).max(10),
});

const vehicleIdParamSchema = z.object({
    vehicleId: z.string().uuid(),
});

export const parseAddCartItem = (body: unknown): AddCartItemInput => {
    const result = addCartItemSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid cart item data',
            result.error.flatten()
        );
    }

    return result.data;
};

export const parseUpdateCartItem = (body: unknown): UpdateCartItemInput => {
    const result = updateCartItemSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(400, 'Invalid quantity', result.error.flatten());
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