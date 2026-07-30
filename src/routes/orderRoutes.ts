import { Router } from 'express';
import {
    listMyOrders,
    postCheckout,
    postRetryPayment,
    showMyOrder,
} from '../controllers/orderController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// An order always belongs to a signed-in customer, so every route is protected.

// UC12: checkout and order processing.
router.post('/', requireAuth, postCheckout);

// UC12: order history for the signed-in customer.
router.get('/', requireAuth, listMyOrders);

// UC12: a single order confirmation.
router.get('/:orderId', requireAuth, showMyOrder);

// UC12: retry a declined payment without rebuilding the cart.
router.post('/:orderId/payment', requireAuth, postRetryPayment);

export default router;
