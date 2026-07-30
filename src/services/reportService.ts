import {
    findMostViewedVehicles,
    findSalesBreakdown,
    findSalesTotals,
    findTopSearchTerms,
    findUsageByEventType,
    findUsageTotals,
} from '../repositories/reportRepository';
import {
    ReportDateRange,
    SalesReportQuery,
    SalesReportResponse,
    UsageReportResponse,
} from '../types/report';

const round = (value: number): number => Number(value.toFixed(2));

const isoOrNull = (value?: Date): string | null =>
    value ? value.toISOString() : null;

/**
 * UC15: administrator sales report.
 */
export const getSalesReport = async (
    query: SalesReportQuery
): Promise<SalesReportResponse> => {
    const range: ReportDateRange = { from: query.from, to: query.to };

    const [totals, rows] = await Promise.all([
        findSalesTotals(range),
        findSalesBreakdown(range, query.groupBy),
    ]);

    return {
        groupBy: query.groupBy,
        from: isoOrNull(query.from),
        to: isoOrNull(query.to),
        totals: {
            orderCount: totals.orderCount,
            unitsSold: totals.unitsSold,
            grossRevenue: round(totals.grossRevenue),
            netRevenue: round(totals.netRevenue),
            taxCollected: round(totals.grossRevenue - totals.netRevenue),
            // Average of what customers actually paid, so gross rather than net.
            averageOrderValue:
                totals.orderCount === 0
                    ? 0
                    : round(totals.grossRevenue / totals.orderCount),
        },
        rows: rows.map((row) => ({
            label: row.label,
            orderCount: row.orderCount,
            unitsSold: row.unitsSold,
            revenue: round(row.revenue),
        })),
    };
};

/**
 * UC16: administrator website usage report.
 */
export const getUsageReport = async (
    range: ReportDateRange
): Promise<UsageReportResponse> => {
    const [totals, eventsByType, mostViewedVehicles, topSearchTerms] =
        await Promise.all([
            findUsageTotals(range),
            findUsageByEventType(range),
            findMostViewedVehicles(range),
            findTopSearchTerms(range),
        ]);

    return {
        from: isoOrNull(range.from),
        to: isoOrNull(range.to),
        totals,
        eventsByType,
        mostViewedVehicles,
        topSearchTerms,
    };
};
