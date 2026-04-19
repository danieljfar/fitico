import { Router } from 'express';
import authRoutes from './authRoutes.js';
import reservationRoutes from './reservationRoutes.js';
import slotRoutes from './slotRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/slots', slotRoutes);
router.use('/reservations', reservationRoutes);

export default router;