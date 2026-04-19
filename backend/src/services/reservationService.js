import { sequelize } from '../database/index.js';
import { emitSocketEvent } from '../config/socket.js';
import { ApiError } from '../utils/apiError.js';
import { createBooking, findActiveBooking, findBookingById, findUserBookings } from '../repositories/reservationRepository.js';
import { findSlotById } from '../repositories/slotRepository.js';

function serializeBooking(booking) {
  return {
    id: booking.id,
    status: booking.status,
    userId: booking.userId,
    slotId: booking.slotId,
    externalBookingId: booking.externalBookingId,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    slot: booking.slot
      ? {
          id: booking.slot.id,
          title: booking.slot.title,
          startsAt: booking.slot.startsAt,
          capacity: booking.slot.capacity,
          bookedCount: booking.slot.bookedCount,
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

    const activeBooking = await findActiveBooking(userId, slotId, transaction);

    if (activeBooking) {
      throw new ApiError(409, 'You already have an active booking for this slot');
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new ApiError(409, 'Slot is full');
    }

    slot.bookedCount += 1;
    await slot.save({ transaction });

    const booking = await createBooking(
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

    return serializeBooking({
      ...booking.toJSON(),
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
    const booking = await findBookingById(reservationId, transaction);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ApiError(403, 'You cannot cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(409, 'Booking was already cancelled');
    }

    const slot = await findSlotById(booking.slotId, transaction);

    booking.status = 'cancelled';
    await booking.save({ transaction });

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

    return serializeBooking({
      ...booking.toJSON(),
      slot: slot ? slot.toJSON() : booking.slot,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listReservations(userId) {
  const bookings = await findUserBookings(userId);
  return bookings.map(serializeBooking);
}

export const listBookings = listReservations;