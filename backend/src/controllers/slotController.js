import { asyncHandler } from '../utils/asyncHandler.js';
import { listSlots } from '../services/slotService.js';

export const getSlots = asyncHandler(async (req, res) => {
  const slots = await listSlots();
  res.json({ slots });
});