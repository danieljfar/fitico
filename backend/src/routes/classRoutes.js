import { Router } from 'express';
import { getClasses, getFeaturedInstructors } from '../controllers/classController.js';

const router = Router();

router.get('/featured-instructors', getFeaturedInstructors);
router.get('/', getClasses);

export default router;