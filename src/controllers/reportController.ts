import { NextFunction, Request, Response } from 'express';
import { getSalesReport, getUsageReport } from '../services/reportService';
import {
    parseSalesReportQuery,
    parseUsageReportQuery,
} from '../validators/reportValidator';

// UC15: sales report.
export const showSalesReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const query = parseSalesReportQuery(req.query);
        const report = await getSalesReport(query);

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// UC16: website usage report.
export const showUsageReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const range = parseUsageReportQuery(req.query);
        const report = await getUsageReport(range);

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
};
