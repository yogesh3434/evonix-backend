import { z } from 'zod';
import { AppError } from '../errors/AppError';

const vehicleIdParamSchema = z.object({
    vehicleId: z.string().uuid(),
});

export const parseCustomizationVehicleId = (params: unknown): string => {
    const result = vehicleIdParamSchema.safeParse(params);

    if (!result.success) {
        throw new AppError(400, 'Invalid vehicle ID', result.error.flatten());
    }

    return result.data.vehicleId;
};
