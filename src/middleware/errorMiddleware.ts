import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const errorMiddleware = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error(error);

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            details: error.details,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};