import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../middleware/authMiddleware';
import {
    checkout,
    getMyOrder,
    getMyOrders,
    retryOrderPayment,
} from '../services/orderService';
import {
    parseCheckout,
    parseOrderIdParam,
    parseRetryPayment,
} from '../validators/orderValidator';

// UC12: checkout and payment.
export const postCheckout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const input = parseCheckout(req.body);
        const order = await checkout(user.id, input);

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// UC12: retry payment on a declined order.
export const postRetryPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const orderId = parseOrderIdParam(req.params);
        const { cardNumber, cardHolderName } = parseRetryPayment(req.body);

        const order = await retryOrderPayment(
            user.id,
            orderId,
            cardNumber,
            cardHolderName
        );

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

export const listMyOrders = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const orders = await getMyOrders(user.id);

        res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

export const showMyOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const orderId = parseOrderIdParam(req.params);
        const order = await getMyOrder(user.id, orderId);

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};
