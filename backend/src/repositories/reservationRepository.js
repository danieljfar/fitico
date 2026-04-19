import { Reservation, Slot } from '../database/index.js';

export function createReservation(reservationData, transaction) {
  return Reservation.create(reservationData, { transaction });
}

export function findReservationById(reservationId, transaction) {
  return Reservation.findByPk(reservationId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
    include: [{ model: Slot, as: 'slot' }],
  });
}

export function findUserReservations(userId) {
  return Reservation.findAll({
    where: { userId },
    include: [{ model: Slot, as: 'slot' }],
    order: [['createdAt', 'DESC']],
  });
}

export function findActiveReservation(userId, slotId, transaction) {
  return Reservation.findOne({
    where: { userId, slotId, status: 'active' },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
}