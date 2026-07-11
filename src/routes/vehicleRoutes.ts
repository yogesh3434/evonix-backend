import { Router } from 'express';
import {
    listHotDeals,
    listVehicles,
    showVehicle,
} from '../controllers/vehicleController';

const router = Router();

router.get('/', listVehicles);
router.get('/hot-deals', listHotDeals);
router.get('/:id', showVehicle);

export default router;