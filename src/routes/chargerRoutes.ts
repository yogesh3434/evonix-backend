import { Router } from 'express';
import { getChargerEstimate } from '../controllers/chargerController';

const router = Router();

// UC17: estimate home charger installation cost.
router.get('/estimate', getChargerEstimate);

export default router;