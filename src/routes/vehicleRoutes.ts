import { Router } from 'express';
import {
    compareVehiclesHandler,
    listHotDeals,
    listVehicles,
    showVehicle,
} from '../controllers/vehicleController';

const router = Router();

router.get('/', listVehicles);
router.get('/hot-deals', listHotDeals);
router.get('/compare', compareVehiclesHandler);
router.get('/:id', showVehicle);

export default router;