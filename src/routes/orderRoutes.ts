import { Router } from 'express';
import {
    listMyOrders,
    postCheckout,
    postRetryPayment,
    showMyOrder,
} from '../controllers/orderController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, postCheckout);

router.get('/', requireAuth, listMyOrders);

router.get('/:orderId', requireAuth, showMyOrder);

router.post('/:orderId/payment', requireAuth, postRetryPayment);

export default router;
