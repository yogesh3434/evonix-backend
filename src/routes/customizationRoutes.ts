import { Router } from 'express';
import { listVehicleCustomizations } from '../controllers/customizationController';

const router = Router();

/**
 * Mounted on /api/vehicles alongside vehicleRoutes. Browsing the configurator
 * does not require an account, the same as browsing the catalogue does not.
 *
 * UC11: select customization options.
 */
router.get('/:vehicleId/customizations', listVehicleCustomizations);

export default router;
