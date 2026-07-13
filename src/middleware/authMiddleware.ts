import { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../errors/AppError';

export type AuthenticatedUser = {
    id: string;
    email: string | undefined;
};

// Verifies the Supabase access token issued after the OAuth redirect completes (Google/Facebook/etc.) and attaches the resulting user to res.locals.user. 
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'Missing bearer token');
        }

        const accessToken = authHeader.slice('Bearer '.length);
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data.user) {
            throw new AppError(401, 'Invalid or expired session');
        }

        const user: AuthenticatedUser = {
            id: data.user.id,
            email: data.user.email,
        };

        res.locals.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
