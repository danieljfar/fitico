import { asyncHandler } from '../utils/asyncHandler.js';
import { cancelReservation, listReservations, reserveSlot } from '../services/reservationService.js';

export const createReservation = asyncHandler(async (req, res) => {
  const reservation = await reserveSlot(req.user.id, Number(req.body.slotId));
  res.status(201).json({ reservation });
});

export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await listReservations(req.user.id);
  res.json({ reservations });
});

export const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await cancelReservation(req.user.id, Number(req.params.id));
  res.json({ reservation });
});