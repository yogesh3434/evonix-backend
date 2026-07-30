import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { ReportDateRange, SalesReportQuery } from '../types/report';

const dateRangeSchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});

const salesReportSchema = dateRangeSchema.extend({
    groupBy: z.enum(['month', 'brand', 'vehicle']).default('month'),
});

const assertOrderedRange = (range: ReportDateRange): void => {
    if (range.from && range.to && range.from > range.to) {
        throw new AppError(400, 'The start date must fall before the end date');
    }
};

export const parseSalesReportQuery = (query: unknown): SalesReportQuery => {
    const result = salesReportSchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid report parameters',
            result.error.flatten()
        );
    }

    assertOrderedRange(result.data);

    return result.data;
};

export const parseUsageReportQuery = (query: unknown): ReportDateRange => {
    const result = dateRangeSchema.safeParse(query);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid report parameters',
            result.error.flatten()
        );
    }

    assertOrderedRange(result.data);

    return result.data;
};
