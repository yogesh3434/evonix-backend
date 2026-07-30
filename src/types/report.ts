export type ReportDateRange = {
    from?: Date;
    to?: Date;
};

export type SalesGroupBy = 'month' | 'brand' | 'vehicle';

export type SalesReportQuery = ReportDateRange & {
    groupBy: SalesGroupBy;
};

export type SalesReportRow = {
    label: string;
    orderCount: number;
    unitsSold: number;

    revenue: number;
};

export type SalesReportResponse = {
    groupBy: SalesGroupBy;
    from: string | null;
    to: string | null;
    totals: {
        orderCount: number;
        unitsSold: number;

        grossRevenue: number;

        netRevenue: number;
        taxCollected: number;
        averageOrderValue: number;
    };
    rows: SalesReportRow[];
};

export type UsageReportResponse = {
    from: string | null;
    to: string | null;
    totals: {
        totalEvents: number;
        uniqueVisitors: number;
    };
    eventsByType: { eventType: string; eventCount: number }[];
    mostViewedVehicles: {
        vehicleId: string;
        name: string;
        brand: string;
        viewCount: number;
    }[];
    topSearchTerms: { searchTerm: string; searchCount: number }[];
};
