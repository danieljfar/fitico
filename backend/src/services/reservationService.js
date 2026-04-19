import { sequelize } from '../database/index.js';
import { emitSocketEvent } from '../config/socket.js';
import { ApiError } from '../utils/apiError.js';
import { createReservation, findActiveReservation, findReservationById, findUserReservations } from '../repositories/reservationRepository.js';
import { findSlotById } from '../repositories/slotRepository.js';

function serializeReservation(reservation) {
  return {
    id: reservation.id,
    status: reservation.status,
    userId: reservation.userId,
    slotId: reservation.slotId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    slot: reservation.slot
      ? {
          id: reservation.slot.id,
          title: reservation.slot.title,
          startsAt: reservation.slot.startsAt,
          capacity: reservation.slot.capacity,
          bookedCount: reservation.slot.bookedCount,
        }
      : null,
  };
}

export async function reserveSlot(userId, slotId) {
  const transaction = await sequelize.transaction();

  try {
    const slot = await findSlotById(slotId, transaction);

    if (!slot) {
      throw new ApiError(404, 'Slot not found');
    }

    const activeReservation = await findActiveReservation(userId, slotId, transaction);

    if (activeReservation) {
      throw new ApiError(409, 'You already reserved this slot');
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new ApiError(409, 'Slot is full');
    }

    slot.bookedCount += 1;
    await slot.save({ transaction });

    const reservation = await createReservation(
      {
        userId,
        slotId,
        status: 'active',
      },
      transaction
    );

    await transaction.commit();

    emitSocketEvent('slot_updated', {
      slotId: slot.id,
      bookedCount: slot.bookedCount,
      capacity: slot.capacity,
    });

    return serializeReservation({
      ...reservation.toJSON(),
      slot: slot.toJSON(),
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function cancelReservation(userId, reservationId) {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await findReservationById(reservationId, transaction);

    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new ApiError(403, 'You cannot cancel this reservation');
    }

    if (reservation.status === 'cancelled') {
      throw new ApiError(409, 'Reservation was already cancelled');
    }

    const slot = await findSlotById(reservation.slotId, transaction);

    reservation.status = 'cancelled';
    await reservation.save({ transaction });

    if (slot && slot.bookedCount > 0) {
      slot.bookedCount -= 1;
      await slot.save({ transaction });
    }

    await transaction.commit();

    if (slot) {
      emitSocketEvent('slot_updated', {
        slotId: slot.id,
        bookedCount: slot.bookedCount,
        capacity: slot.capacity,
      });
    }

    return serializeReservation({
      ...reservation.toJSON(),
      slot: slot ? slot.toJSON() : reservation.slot,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listReservations(userId) {
  const reservations = await findUserReservations(userId);
  return reservations.map(serializeReservation);
}