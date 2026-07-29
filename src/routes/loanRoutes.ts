import { Router } from 'express';
import { getLoanEstimate } from '../controllers/loanController';

const router = Router();

// UC9: estimate monthly payment for a vehicle loan.
router.get('/estimate', getLoanEstimate);

export default router;