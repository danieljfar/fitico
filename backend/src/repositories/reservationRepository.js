import { Booking, Slot } from '../database/index.js';

export function createBooking(bookingData, transaction) {
  return Booking.create(bookingData, { transaction });
}

export function findBookingById(bookingId, transaction) {
  return Booking.findByPk(bookingId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
    include: [{ model: Slot, as: 'slot' }],
  });
}

export function findUserBookings(userId) {
  return Booking.findAll({
    where: { userId },
    include: [{ model: Slot, as: 'slot' }],
    order: [['createdAt', 'DESC']],
  });
}

export function findActiveBooking(userId, slotId, transaction) {
  return Booking.findOne({
    where: { userId, slotId, status: 'active' },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
}