import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../entities/Profile';
import { AppError } from '../errors/AppError';
import { findProfileById } from '../repositories/profileRepository';
import { AuthenticatedUser } from './authMiddleware';

/**
 * Restricts a route to administrators. Runs after requireAuth, which has already
 * verified the token and put the user on res.locals.
 *
 * The role is read from the profiles table on every request rather than trusted
 * from the token, so revoking an admin takes effect immediately instead of when
 * that user's session happens to expire.
 */
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
            // 403, not 404: the caller is authenticated, they simply are not
            // permitted. 401 would wrongly suggest signing in again would help.
            throw new AppError(403, 'Administrator access required');
        }

        res.locals.profile = profile;
        next();
    } catch (error) {
        next(error);
    }
};
