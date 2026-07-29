import { z } from 'zod';
import { AppError } from '../errors/AppError';

const chatSchema = z.object({
    message: z.string().trim().min(1).max(1000),
});

export const parseChatMessage = (body: unknown): string => {
    const result = chatSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid chat message',
            result.error.flatten()
        );
    }

    return result.data.message;
};