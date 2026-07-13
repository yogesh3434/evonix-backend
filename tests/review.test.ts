/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as reviewRepository from '../src/repositories/reviewRepository';
import { ReviewStatus } from '../src/entities/Review';

jest.mock('../src/middleware/authMiddleware', () => ({
    requireAuth: (_req: any, res: any, next: any) => {
        res.locals.user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'test@example.com',
        };
        next();
    },
}));

jest.mock('../src/repositories/reviewRepository');

const mockedRepo = reviewRepository as jest.Mocked<typeof reviewRepository>;

const VALID_VEHICLE_ID = 'c5c21f34-528b-4736-bbd7-4a670728abfc';
const MISSING_VEHICLE_ID = '00000000-0000-4000-8000-000000000000';

describe('Reviews API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('TC-019: creates a review when the input is valid', async () => {
        mockedRepo.vehicleExists.mockResolvedValue(true);
        mockedRepo.findReviewByUserAndVehicle.mockResolvedValue(null);
       mockedRepo.saveReview.mockResolvedValue({
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            userId: '11111111-1111-1111-1111-111111111111',
            vehicleId: VALID_VEHICLE_ID,
            rating: 4,
            title: 'Great SUV',
            body: 'Excellent range and very quiet.',
            status: ReviewStatus.APPROVED,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        const response = await request(app).post('/api/reviews').send({
            vehicleId: VALID_VEHICLE_ID,
            rating: 4,
            title: 'Great SUV',
            body: 'Excellent range and very quiet.',
        });

        expect(response.status).toBe(201);
        expect(response.body.data.rating).toBe(4);
        expect(response.body.data.status).toBe('approved');
        expect(mockedRepo.saveReview).toHaveBeenCalled();
    });

    it('TC-020: rejects a rating above five', async () => {
        const response = await request(app).post('/api/reviews').send({
            vehicleId: VALID_VEHICLE_ID,
            rating: 6,
            body: 'Too generous.',
        });

        expect(response.status).toBe(400);
        expect(mockedRepo.saveReview).not.toHaveBeenCalled();
    });

    it('TC-021: returns 404 when the vehicle does not exist', async () => {
        mockedRepo.vehicleExists.mockResolvedValue(false);

        const response = await request(app).post('/api/reviews').send({
            vehicleId: MISSING_VEHICLE_ID,
            rating: 5,
            body: 'Reviewing a car that is not there.',
        });

        expect(response.status).toBe(404);
        expect(mockedRepo.saveReview).not.toHaveBeenCalled();
    });

    it('TC-022: returns approved reviews and the average rating', async () => {
        mockedRepo.vehicleExists.mockResolvedValue(true);
        mockedRepo.findReviewsByVehicle.mockResolvedValue([
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                userId: '11111111-1111-1111-1111-111111111111',
                vehicleId: VALID_VEHICLE_ID,
                rating: 5,
                title: 'Excellent',
                body: 'Best EV I have owned.',
                status: ReviewStatus.APPROVED,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                userId: '44444444-4444-4444-4444-444444444444',
                vehicleId: VALID_VEHICLE_ID,
                rating: 3,
                title: 'Decent',
                body: 'Good, but slow charging.',
                status: ReviewStatus.APPROVED,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ] as any);
        mockedRepo.findAverageRating.mockResolvedValue(4);

        const response = await request(app).get(
            `/api/reviews/vehicle/${VALID_VEHICLE_ID}`
        );

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(2);
        expect(response.body.averageRating).toBe(4);
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});