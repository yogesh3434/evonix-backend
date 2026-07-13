import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../middleware/authMiddleware';
import {
    addItemToCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from '../services/cartService';
import {
    parseAddCartItem,
    parseUpdateCartItem,
    parseVehicleIdParam,
} from '../validators/cartValidator';

export const showCart = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const cart = await getCart(user.id);

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

export const postCartItem = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const input = parseAddCartItem(req.body);
        const cart = await addItemToCart(user.id, input);

        res.status(201).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

export const patchCartItem = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const vehicleId = parseVehicleIdParam(req.params);
        const input = parseUpdateCartItem(req.body);
        const cart = await updateCartItem(user.id, vehicleId, input);

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCartItemById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = res.locals.user as AuthenticatedUser;
        const vehicleId = parseVehicleIdParam(req.params);
        const cart = await removeCartItem(user.id, vehicleId);

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};