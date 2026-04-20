import { Router } from 'express';
import {
  createClassHandler,
  createInstructorHandler,
  dashboard,
  deleteInstructorHandler,
  listClassReservationsHandler,
  listClassesHandler,
  listInstructorsHandler,
  updateInstructorHandler,
} from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);

router.get('/instructors', listInstructorsHandler);
router.post('/instructors', createInstructorHandler);
router.put('/instructors/:instructorId', updateInstructorHandler);
router.delete('/instructors/:instructorId', deleteInstructorHandler);

router.get('/classes', listClassesHandler);
router.post('/classes', createClassHandler);
router.get('/classes/:classId/reservations', listClassReservationsHandler);

export default router;
