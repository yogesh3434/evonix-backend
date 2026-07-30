import { AppDataSource } from '../config/datasource';
import { Order, PaymentStatus } from '../entities/Order';
import { UsageEvent, UsageEventType } from '../entities/UsageEvent';
import { ReportDateRange, SalesGroupBy } from '../types/report';

/**
 * Every aggregate in this file is computed by the database rather than by
 * loading rows into memory and summing them in Node. On a sales table that
 * grows with the business, the difference is the whole report.
 */

const SQL_GROUPING: Record<SalesGroupBy, { expression: string; label: string }> =
    {
        month: {
            expression: "TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM')",
            label: 'month',
        },
        brand: {
            expression: 'v.brand',
            label: 'brand',
        },
        vehicle: {
            expression: "CONCAT(v.brand, ' ', v.model, ' (', v.model_year, ')')",
            label: 'vehicle',
        },
    };

const applyDateRange = <T extends { andWhere: Function }>(
    queryBuilder: T,
    range: ReportDateRange,
    column: string
): T => {
    if (range.from) {
        queryBuilder.andWhere(`${column} >= :from`, { from: range.from });
    }

    if (range.to) {
        queryBuilder.andWhere(`${column} <= :to`, { to: range.to });
    }

    return queryBuilder;
};

export type SalesTotalsRow = {
    orderCount: number;
    unitsSold: number;
    /** Money actually charged, tax included. What the business banked. */
    grossRevenue: number;
    /** Revenue before tax. This is the figure the breakdown rows add up to. */
    netRevenue: number;
};

/**
 * Headline numbers across all paid orders in the window.
 *
 * Revenue comes off the orders table so tax is counted once. Units come off the
 * items table. Doing both in one grouped query would multiply the order total by
 * the number of lines on it, which is the classic fan-out mistake.
 *
 * Two revenue figures are returned on purpose. Gross is what was charged and
 * includes tax; net excludes it. Net is the one that reconciles against the
 * per-brand and per-month breakdown, because tax sits on the order and cannot be
 * attributed to an individual line.
 */
export const findSalesTotals = async (
    range: ReportDateRange
): Promise<SalesTotalsRow> => {
    const orderQuery = AppDataSource.getRepository(Order)
        .createQueryBuilder('o')
        .select('COUNT(*)', 'order_count')
        .addSelect('COALESCE(SUM(o.total), 0)', 'gross_revenue')
        .addSelect('COALESCE(SUM(o.subtotal), 0)', 'net_revenue')
        .where('o.payment_status = :status', {
            status: PaymentStatus.APPROVED,
        });

    applyDateRange(orderQuery, range, 'o.created_at');

    const orderRow = await orderQuery.getRawOne();

    const unitsQuery = AppDataSource.getRepository(Order)
        .createQueryBuilder('o')
        .innerJoin('order_items', 'oi', 'oi.order_id = o.id')
        .select('COALESCE(SUM(oi.quantity), 0)', 'units_sold')
        .where('o.payment_status = :status', {
            status: PaymentStatus.APPROVED,
        });

    applyDateRange(unitsQuery, range, 'o.created_at');

    const unitsRow = await unitsQuery.getRawOne();

    return {
        orderCount: Number(orderRow?.order_count ?? 0),
        grossRevenue: Number(orderRow?.gross_revenue ?? 0),
        netRevenue: Number(orderRow?.net_revenue ?? 0),
        unitsSold: Number(unitsRow?.units_sold ?? 0),
    };
};

export type SalesBreakdownRow = {
    label: string;
    orderCount: number;
    unitsSold: number;
    revenue: number;
};

/**
 * Sales broken down by month, brand or individual vehicle.
 *
 * Revenue here is line revenue before tax: quantity times the unit price plus
 * its customizations. It has to be, because one order can span several brands and
 * the tax on the order cannot be attributed to any single one of them. Summing
 * these rows reproduces netRevenue from findSalesTotals, not grossRevenue.
 */
export const findSalesBreakdown = async (
    range: ReportDateRange,
    groupBy: SalesGroupBy
): Promise<SalesBreakdownRow[]> => {
    const grouping = SQL_GROUPING[groupBy];

    const queryBuilder = AppDataSource.getRepository(Order)
        .createQueryBuilder('o')
        .innerJoin('order_items', 'oi', 'oi.order_id = o.id')
        .innerJoin('vehicles', 'v', 'v.id = oi.vehicle_id')
        .select(`${grouping.expression}`, 'label')
        .addSelect('COUNT(DISTINCT o.id)', 'order_count')
        .addSelect('COALESCE(SUM(oi.quantity), 0)', 'units_sold')
        .addSelect(
            'COALESCE(SUM(oi.quantity * (oi.unit_price + oi.customization_total)), 0)',
            'revenue'
        )
        .where('o.payment_status = :status', {
            status: PaymentStatus.APPROVED,
        });

    applyDateRange(queryBuilder, range, 'o.created_at');

    const rows = await queryBuilder
        .groupBy(grouping.expression)
        .orderBy('revenue', 'DESC')
        .getRawMany();

    return rows.map((row) => ({
        label: String(row.label ?? 'Unknown'),
        orderCount: Number(row.order_count ?? 0),
        unitsSold: Number(row.units_sold ?? 0),
        revenue: Number(row.revenue ?? 0),
    }));
};

export const findUsageTotals = async (
    range: ReportDateRange
): Promise<{ totalEvents: number; uniqueVisitors: number }> => {
    const queryBuilder = AppDataSource.getRepository(UsageEvent)
        .createQueryBuilder('e')
        .select('COUNT(*)', 'total_events')
        .addSelect(
            'COUNT(DISTINCT COALESCE(e.user_id::text, e.ip_address::text))',
            'unique_visitors'
        );

    applyDateRange(queryBuilder, range, 'e.occurred_at');

    const row = await queryBuilder.getRawOne();

    return {
        totalEvents: Number(row?.total_events ?? 0),
        uniqueVisitors: Number(row?.unique_visitors ?? 0),
    };
};

export const findUsageByEventType = async (
    range: ReportDateRange
): Promise<{ eventType: string; eventCount: number }[]> => {
    const queryBuilder = AppDataSource.getRepository(UsageEvent)
        .createQueryBuilder('e')
        .select('e.event_type', 'event_type')
        .addSelect('COUNT(*)', 'event_count');

    applyDateRange(queryBuilder, range, 'e.occurred_at');

    const rows = await queryBuilder
        .groupBy('e.event_type')
        .orderBy('event_count', 'DESC')
        .getRawMany();

    return rows.map((row) => ({
        eventType: String(row.event_type),
        eventCount: Number(row.event_count ?? 0),
    }));
};

export const findMostViewedVehicles = async (
    range: ReportDateRange,
    limit = 10
): Promise<
    { vehicleId: string; name: string; brand: string; viewCount: number }[]
> => {
    const queryBuilder = AppDataSource.getRepository(UsageEvent)
        .createQueryBuilder('e')
        .innerJoin('vehicles', 'v', 'v.id = e.vehicle_id')
        .select('v.id', 'vehicle_id')
        .addSelect('v.name', 'name')
        .addSelect('v.brand', 'brand')
        .addSelect('COUNT(*)', 'view_count')
        .where('e.event_type = :eventType', {
            eventType: UsageEventType.VIEW,
        });

    applyDateRange(queryBuilder, range, 'e.occurred_at');

    const rows = await queryBuilder
        .groupBy('v.id')
        .addGroupBy('v.name')
        .addGroupBy('v.brand')
        .orderBy('view_count', 'DESC')
        .limit(limit)
        .getRawMany();

    return rows.map((row) => ({
        vehicleId: String(row.vehicle_id),
        name: String(row.name ?? ''),
        brand: String(row.brand ?? ''),
        viewCount: Number(row.view_count ?? 0),
    }));
};

export const findTopSearchTerms = async (
    range: ReportDateRange,
    limit = 10
): Promise<{ searchTerm: string; searchCount: number }[]> => {
    const queryBuilder = AppDataSource.getRepository(UsageEvent)
        .createQueryBuilder('e')
        .select('LOWER(e.search_term)', 'search_term')
        .addSelect('COUNT(*)', 'search_count')
        .where('e.event_type = :eventType', {
            eventType: UsageEventType.SEARCH,
        })
        .andWhere('e.search_term IS NOT NULL');

    applyDateRange(queryBuilder, range, 'e.occurred_at');

    const rows = await queryBuilder
        .groupBy('LOWER(e.search_term)')
        .orderBy('search_count', 'DESC')
        .limit(limit)
        .getRawMany();

    return rows.map((row) => ({
        searchTerm: String(row.search_term ?? ''),
        searchCount: Number(row.search_count ?? 0),
    }));
};

export const saveUsageEvent = async (
    event: Partial<UsageEvent>
): Promise<void> => {
    const repository = AppDataSource.getRepository(UsageEvent);

    await repository.save(repository.create(event));
};
