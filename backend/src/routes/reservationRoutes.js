import { Router } from 'express';
import { createReservation, deleteReservation, getMyReservations } from '../controllers/reservationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/me', getMyReservations);
router.post('/', createReservation);
router.delete('/:id', deleteReservation);

export default router;