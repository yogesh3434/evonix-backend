import { Router } from 'express';
import {
    showSalesReport,
    showUsageReport,
} from '../controllers/reportController';
import { requireAdmin } from '../middleware/adminMiddleware';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/reports/sales', requireAuth, requireAdmin, showSalesReport);

router.get('/reports/usage', requireAuth, requireAdmin, showUsageReport);

export default router;
