import { Router } from 'express';
import { listVehicleCustomizations } from '../controllers/customizationController';

const router = Router();

router.get('/:vehicleId/customizations', listVehicleCustomizations);

export default router;
