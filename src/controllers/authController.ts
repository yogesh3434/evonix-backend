import { NextFunction, Request, Response } from 'express';
import {
    completeProfile,
    getCurrentUser,
    signOutUser,
} from '../services/authService';
import { validateCompleteProfileInput } from '../validators/authValidators';
import { AuthenticatedUser } from '../middleware/authMiddleware';

// UC2: Sign in (verification step)
// The OAuth handshake itself runs on the frontend (supabase.auth.signInWithOAuth)
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : undefined;

        if (!accessToken) {
            res.status(401).json({
                success: false,
                message: 'Missing bearer token',
            });
            return;
        }

        const result = await getCurrentUser(accessToken);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// UC1: Register (second half - phone / default address).
export const patchProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const input = validateCompleteProfileInput(req.body);

        const result = await completeProfile({ userId: user.id, ...input });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// UC3: Sign out. Requires requireAuth to have already validated the token being revoked.
export const signOut = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization as string;
        const accessToken = authHeader.slice('Bearer '.length);

        await signOutUser(accessToken);
        res.status(200).json({ success: true, message: 'Signed out' });
    } catch (error) {
        next(error);
    }
};
