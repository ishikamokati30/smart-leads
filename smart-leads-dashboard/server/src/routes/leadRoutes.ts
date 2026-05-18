import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeadsCsv,
} from '../controllers/leadController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply protect middleware to all lead routes
router.use(protect);

// Specific route for export before /:id to prevent conflict
router.get('/export/csv', authorizeRoles('admin', 'sales_user'), exportLeadsCsv);

router
  .route('/')
  .get(authorizeRoles('admin', 'sales_user'), getLeads)
  .post(authorizeRoles('admin', 'sales_user'), createLead);

router
  .route('/:id')
  .get(authorizeRoles('admin', 'sales_user'), getLeadById)
  .put(authorizeRoles('admin', 'sales_user'), updateLead)
  .delete(authorizeRoles('admin'), deleteLead); // Admin only for delete

export default router;
