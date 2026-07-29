import { z } from 'zod';
import { AppError } from '../errors/AppError';

const chargerSchema = z.object({
    propertyType: z.enum(['house', 'condo']),
    chargerLevel: z.enum(['level1', 'level2']),
    distanceToPanel: z.coerce.number().nonnegative().max(200),
});

export type ChargerQuery = z.infer<typeof chargerSchema>;

export const parseChargerQuery = (query: unknown): ChargerQuery => {
    const result = chargerSchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid charger estimate parameters',
            result.error.flatten()
        );
    }

    return result.data;
};