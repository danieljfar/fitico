import { asyncHandler } from '../utils/asyncHandler.js';
import { cancelReservation, listReservations, reserveSlot } from '../services/reservationService.js';

export const createReservation = asyncHandler(async (req, res) => {
  const booking = await reserveSlot(req.user.id, Number(req.body.slotId));
  res.status(201).json({ booking, reservation: booking });
});

export const getMyReservations = asyncHandler(async (req, res) => {
  const bookings = await listReservations(req.user.id);
  res.json({ bookings, reservations: bookings });
});

export const deleteReservation = asyncHandler(async (req, res) => {
  const booking = await cancelReservation(req.user.id, Number(req.params.id));
  res.json({ booking, reservation: booking });
});