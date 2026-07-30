import { Router } from 'express';
import {
    showSalesReport,
    showUsageReport,
} from '../controllers/reportController';
import { requireAdmin } from '../middleware/adminMiddleware';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Reports expose business data, so both middleware run on every route:
// requireAuth proves who the caller is, requireAdmin proves they may see it.

// UC15: sales report.
router.get('/reports/sales', requireAuth, requireAdmin, showSalesReport);

// UC16: website usage report.
router.get('/reports/usage', requireAuth, requireAdmin, showUsageReport);

export default router;
