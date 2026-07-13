import { Router } from 'express';
import {
    getReviewsForVehicle,
    postReview,
} from '../controllers/reviewController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();


router.post('/', requireAuth, postReview);


router.get('/vehicle/:vehicleId', getReviewsForVehicle);

export default router;