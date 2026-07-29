import { NextFunction, Request, Response } from 'express';
import { calculateLoan } from '../services/loanService';
import { parseLoanQuery } from '../validators/loanValidator';

export const getLoanEstimate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { principal, annualRatePercent, termMonths } = parseLoanQuery(
            req.query
        );

        const estimate = calculateLoan(
            principal,
            annualRatePercent,
            termMonths
        );

        res.status(200).json({ success: true, data: estimate });
    } catch (error) {
        next(error);
    }
};