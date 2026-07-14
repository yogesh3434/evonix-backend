/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/datasource';
import * as authService from '../src/services/authService';

jest.mock('../src/middleware/authMiddleware', () => ({
    requireAuth: (_req: any, res: any, next: any) => {
        res.locals.user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'test@example.com',
        };
        next();
    },
}));

jest.mock('../src/services/authService');

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const USER_ID = '11111111-1111-1111-1111-111111111111';

const validProfile = {
    phone: '416-555-1234',
    address: {
        street: '123 Test Street',
        city: 'Toronto',
        province: 'Ontario',
        country: 'Canada',
        postalCode: 'M1M 1M1',
    },
};

describe('Authentication API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('TC-027: completes registration with valid profile information', async () => {
        mockedAuthService.completeProfile.mockResolvedValue({
            userId: USER_ID,
        });

        const response = await request(app)
            .patch('/api/auth/profile')
            .send(validProfile);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.userId).toBe(USER_ID);

        expect(mockedAuthService.completeProfile).toHaveBeenCalledWith({
            userId: USER_ID,
            ...validProfile,
        });
    });

    it('TC-028: rejects registration when no phone or address is provided', async () => {
        const response = await request(app)
            .patch('/api/auth/profile')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(mockedAuthService.completeProfile).not.toHaveBeenCalled();
    });

    it('TC-029: returns the signed-in user for a valid bearer token', async () => {
        mockedAuthService.getCurrentUser.mockResolvedValue({
            id: USER_ID,
            email: 'test@example.com',
            profile: {
                phone: '416-555-1234',
            },
        });

        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer valid-test-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(USER_ID);

        expect(mockedAuthService.getCurrentUser).toHaveBeenCalledWith(
            'valid-test-token'
        );
    });

    it('TC-030: rejects sign-in verification when the bearer token is missing', async () => {
        const response = await request(app).get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(mockedAuthService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('TC-031: signs out a logged-in user', async () => {
        mockedAuthService.signOutUser.mockResolvedValue(undefined);

        const response = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', 'Bearer valid-test-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Signed out');

        expect(mockedAuthService.signOutUser).toHaveBeenCalledWith(
            'valid-test-token'
        );
    });
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});