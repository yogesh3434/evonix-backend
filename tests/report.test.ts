/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as reportRepository from '../src/repositories/reportRepository';
import * as profileRepository from '../src/repositories/profileRepository';
import { UserRole } from '../src/entities/Profile';

jest.mock('../src/middleware/authMiddleware', () => ({
    requireAuth: (_req: any, res: any, next: any) => {
        res.locals.user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@evonix.ca',
        };
        next();
    },
}));

jest.mock('../src/repositories/reportRepository');
jest.mock('../src/repositories/profileRepository');

const mockedReportRepo = reportRepository as jest.Mocked<
    typeof reportRepository
>;
const mockedProfileRepo = profileRepository as jest.Mocked<
    typeof profileRepository
>;

const USER_ID = '11111111-1111-1111-1111-111111111111';

const profile = (role: UserRole) =>
    ({
        id: USER_ID,
        firstName: 'Amr',
        lastName: 'Alhamwi',
        email: 'admin@evonix.ca',
        role,
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }) as any;

describe('Administrator reports API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedProfileRepo.findProfileById.mockResolvedValue(
            profile(UserRole.ADMIN)
        );

        mockedReportRepo.findSalesTotals.mockResolvedValue({
            orderCount: 4,
            unitsSold: 6,
            grossRevenue: 226000,
            netRevenue: 200000,
        });
        mockedReportRepo.findSalesBreakdown.mockResolvedValue([
            { label: 'Tesla', orderCount: 3, unitsSold: 4, revenue: 160000 },
            { label: 'Rivian', orderCount: 1, unitsSold: 2, revenue: 66000 },
        ]);
        mockedReportRepo.findUsageTotals.mockResolvedValue({
            totalEvents: 120,
            uniqueVisitors: 32,
        });
        mockedReportRepo.findUsageByEventType.mockResolvedValue([
            { eventType: 'view', eventCount: 80 },
            { eventType: 'cart', eventCount: 25 },
        ]);
        mockedReportRepo.findMostViewedVehicles.mockResolvedValue([
            {
                vehicleId: 'c5c21f34-528b-4736-bbd7-4a670728abfc',
                name: 'Tesla Model Y',
                brand: 'Tesla',
                viewCount: 40,
            },
        ]);
        mockedReportRepo.findTopSearchTerms.mockResolvedValue([
            { searchTerm: 'model y', searchCount: 12 },
        ]);
    });

    it('TC-043: returns a sales report with totals and an average order value', async () => {
        const response = await request(app).get(
            '/api/admin/reports/sales?groupBy=brand'
        );

        expect(response.status).toBe(200);
        expect(response.body.data.groupBy).toBe('brand');
        expect(response.body.data.totals.grossRevenue).toBe(226000);
        expect(response.body.data.totals.netRevenue).toBe(200000);
        expect(response.body.data.totals.taxCollected).toBe(26000);
        expect(response.body.data.totals.averageOrderValue).toBe(56500);
        expect(response.body.data.rows).toHaveLength(2);
        expect(response.body.data.rows[0].label).toBe('Tesla');
    });

    it('TC-044: defaults to grouping sales by month and passes the date range through', async () => {
        const response = await request(app).get(
            '/api/admin/reports/sales?from=2026-01-01&to=2026-06-30'
        );

        expect(response.status).toBe(200);
        expect(response.body.data.groupBy).toBe('month');

        const range = mockedReportRepo.findSalesBreakdown.mock.calls[0][0];
        expect(range.from).toBeInstanceOf(Date);
        expect(range.to).toBeInstanceOf(Date);
    });

    it('TC-045: returns 403 when the signed-in user is not an administrator', async () => {
        mockedProfileRepo.findProfileById.mockResolvedValue(
            profile(UserRole.CUSTOMER)
        );

        const response = await request(app).get('/api/admin/reports/sales');

        expect(response.status).toBe(403);
        expect(mockedReportRepo.findSalesTotals).not.toHaveBeenCalled();
    });

    it('TC-046: rejects a date range whose start falls after its end', async () => {
        const response = await request(app).get(
            '/api/admin/reports/sales?from=2026-06-30&to=2026-01-01'
        );

        expect(response.status).toBe(400);
        expect(mockedReportRepo.findSalesTotals).not.toHaveBeenCalled();
    });

    it('TC-047: returns a usage report with event counts and the most viewed vehicles', async () => {
        const response = await request(app).get('/api/admin/reports/usage');

        expect(response.status).toBe(200);
        expect(response.body.data.totals.uniqueVisitors).toBe(32);
        expect(response.body.data.eventsByType[0].eventType).toBe('view');
        expect(response.body.data.mostViewedVehicles[0].name).toBe(
            'Tesla Model Y'
        );
        expect(response.body.data.topSearchTerms[0].searchTerm).toBe('model y');
    });

    it('TC-048: the per-brand rows reconcile against net revenue, not gross', async () => {
        mockedReportRepo.findSalesBreakdown.mockResolvedValue([
            { label: 'Tesla', orderCount: 3, unitsSold: 4, revenue: 140000 },
            { label: 'Rivian', orderCount: 1, unitsSold: 2, revenue: 60000 },
        ]);

        const response = await request(app).get(
            '/api/admin/reports/sales?groupBy=brand'
        );

        const rowSum = response.body.data.rows.reduce(
            (running: number, row: { revenue: number }) => running + row.revenue,
            0
        );

        expect(rowSum).toBe(response.body.data.totals.netRevenue);
        expect(rowSum).not.toBe(response.body.data.totals.grossRevenue);
    });

    it('TC-049: reports zero average order value rather than dividing by zero', async () => {
        mockedReportRepo.findSalesTotals.mockResolvedValue({
            orderCount: 0,
            unitsSold: 0,
            grossRevenue: 0,
            netRevenue: 0,
        });
        mockedReportRepo.findSalesBreakdown.mockResolvedValue([]);

        const response = await request(app).get('/api/admin/reports/sales');

        expect(response.status).toBe(200);
        expect(response.body.data.totals.averageOrderValue).toBe(0);
        expect(response.body.data.rows).toHaveLength(0);
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});
