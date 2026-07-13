import { Router } from 'express';
import {
    deleteCartItemById,
    patchCartItem,
    postCartItem,
    showCart,
} from '../controllers/cartController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// A cart always belongs to a signed-in customer, so every route is protected.

// UC10: view the cart and its running total.
router.get('/', requireAuth, showCart);

// UC10 / UC-M5: add a vehicle to the cart.
router.post('/items', requireAuth, postCartItem);

// UC10 / UC-C2: change the quantity of a vehicle in the cart.
router.patch('/items/:vehicleId', requireAuth, patchCartItem);

// UC10 / UC-C2: remove a vehicle from the cart.
router.delete('/items/:vehicleId', requireAuth, deleteCartItemById);

export default router;