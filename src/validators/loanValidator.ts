import { z } from 'zod';
import { AppError } from '../errors/AppError';

const loanSchema = z.object({
    principal: z.coerce.number().positive(),
    annualRatePercent: z.coerce.number().min(0).max(100),
    termMonths: z.coerce.number().int().positive().max(120),
});

export type LoanQuery = z.infer<typeof loanSchema>;

export const parseLoanQuery = (query: unknown): LoanQuery => {
    const result = loanSchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid loan parameters',
            result.error.flatten()
        );
    }

    return result.data;
};