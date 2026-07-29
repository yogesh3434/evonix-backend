import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { VehicleQuery } from '../types/vehicle';

const currentYear = new Date().getFullYear();

const vehicleQuerySchema = z
    .object({
        brand: z.string().trim().min(1).optional(),

        bodyStyle: z.string().trim().min(1).optional(),

        modelYear: z.coerce
            .number()
            .int()
            .min(1990)
            .max(currentYear + 1)
            .optional(),

        condition: z.enum(['new', 'used']).optional(),

        minPrice: z.coerce.number().nonnegative().optional(),

        maxPrice: z.coerce.number().nonnegative().optional(),

        search: z.string().trim().min(1).max(120).optional(),

        sortBy: z
            .enum(['price', 'mileage', 'modelYear'])
            .default('modelYear'),

        sortOrder: z.enum(['asc', 'desc']).default('desc'),

        page: z.coerce.number().int().positive().default(1),

        limit: z.coerce.number().int().min(1).max(100).default(12),
    });

export const parseVehicleQuery = (query: unknown): VehicleQuery => {
    const result = vehicleQuerySchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid vehicle query parameters',
            result.error.flatten()
        );
    }

    return result.data;
};

const compareSchema = z.object({
    ids: z
        .string()
        .min(1)
        .transform((value) => value.split(','))
        .pipe(z.array(z.string().uuid()).min(2).max(4)),
});

export const parseCompareQuery = (query: unknown): string[] => {
    const result = compareSchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Provide 2 to 4 valid vehicle IDs to compare',
            result.error.flatten()
        );
    }

    return result.data.ids;
};