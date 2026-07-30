import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../entities/Profile';
import { AppError } from '../errors/AppError';
import { findProfileById } from '../repositories/profileRepository';
import { AuthenticatedUser } from './authMiddleware';

export const requireAdmin = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser | undefined;

        if (!user) {
            throw new AppError(401, 'Authentication required');
        }

        const profile = await findProfileById(user.id);

        if (!profile || !profile.isActive || profile.role !== UserRole.ADMIN) {
            throw new AppError(403, 'Administrator access required');
        }

        res.locals.profile = profile;
        next();
    } catch (error) {
        next(error);
    }
};
