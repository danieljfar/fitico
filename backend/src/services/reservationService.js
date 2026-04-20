import { sequelize } from '../database/index.js';
import { emitSocketEvent } from '../config/socket.js';
import { ApiError } from '../utils/apiError.js';
import {
  createBooking,
  findActiveBooking,
  findActiveBookingsByClassId,
  findBookingById,
  findUserBookings,
} from '../repositories/reservationRepository.js';
import { findClassById } from '../repositories/classRepository.js';
import { findOrCreateCreditByUserId } from '../repositories/creditRepository.js';
import { invalidateFeaturedInstructorsCache } from './classService.js';

function serializeBooking(booking) {
  const classItem = booking.class;

  return {
    id: booking.id,
    status: booking.status,
    userId: booking.userId,
    classId: booking.classId,
    creditId: booking.creditId,
    createdBy: booking.createdBy,
    updatedBy: booking.updatedBy,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    class: classItem
      ? {
          id: classItem.id,
          name: classItem.name,
          level: classItem.level,
          durationMinutes: classItem.durationMinutes,
          status: classItem.status,
          instructorId: classItem.instructorId,
          createdBy: classItem.createdBy,
          updatedBy: classItem.updatedBy,
          createdAt: classItem.createdAt,
          updatedAt: classItem.updatedAt,
          instructor: classItem.instructor
            ? {
                id: classItem.instructor.id,
                name: classItem.instructor.name,
                specialty: classItem.instructor.specialty,
                createdBy: classItem.instructor.createdBy,
                updatedBy: classItem.instructor.updatedBy,
              }
            : null,
        }
      : null,
  };
}

function emitClassOccupancyUpdated(classItem) {
  if (!classItem) {
    return;
  }

  const payload = {
    classId: classItem.id,
    bookedCount: classItem.bookedCount,
    capacity: classItem.capacity,
    ...(classItem.status ? { status: classItem.status } : {}),
  };

  emitSocketEvent('class_updated', payload);
  emitSocketEvent('slot_updated', payload);
}

async function reserveClassForUser(userId, classId, actorId) {
  const transaction = await sequelize.transaction();

  try {
    const classItem = await findClassById(classId, transaction);

    if (!classItem) {
      throw new ApiError(404, 'Class not found');
    }

    const activeBooking = await findActiveBooking(userId, classId, transaction);

    if (activeBooking) {
      throw new ApiError(409, 'You already have an active booking for this class');
    }

    const credit = await findOrCreateCreditByUserId(userId, actorId, transaction, true);

    if (!credit || credit.balance <= 0) {
      throw new ApiError(409, 'Insufficient credits to reserve this class');
    }

    if (classItem.bookedCount >= classItem.capacity) {
      throw new ApiError(409, 'Class is full');
    }

    credit.balance -= 1;
    credit.updatedBy = actorId;
    await credit.save({ transaction });

    classItem.bookedCount += 1;
    await classItem.save({ transaction });

    const booking = await createBooking(
      {
        userId,
        classId,
        creditId: credit.id,
        status: 'active',
        createdBy: actorId,
        updatedBy: actorId,
      },
      transaction
    );

    await transaction.commit();

    emitClassOccupancyUpdated(classItem);

    await invalidateFeaturedInstructorsCache();

    return serializeBooking({
      ...booking.toJSON(),
      class: classItem.toJSON(),
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function reserveClass(userId, classId) {
  return reserveClassForUser(userId, classId, userId);
}

export async function reserveClassAsAdmin(userId, classId, actorId) {
  return reserveClassForUser(userId, classId, actorId);
}

async function cancelReservationInternal({ reservationId, actorId, requesterUserId = null, enforceOwner = false }) {
  const transaction = await sequelize.transaction();

  try {
    const booking = await findBookingById(reservationId, transaction);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (enforceOwner && booking.userId !== requesterUserId) {
      throw new ApiError(403, 'You cannot cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(409, 'Booking was already cancelled');
    }

    const classItem = await findClassById(booking.classId, transaction);
    const credit = await findOrCreateCreditByUserId(booking.userId, actorId, transaction, true);

    booking.status = 'cancelled';
    booking.updatedBy = actorId;
    await booking.save({ transaction });

    if (classItem && classItem.bookedCount > 0) {
      classItem.bookedCount -= 1;
      classItem.updatedBy = actorId;
      await classItem.save({ transaction });
    }

    credit.balance += 1;
    credit.updatedBy = actorId;
    await credit.save({ transaction });

    await transaction.commit();

    emitClassOccupancyUpdated(classItem);

    await invalidateFeaturedInstructorsCache();

    return serializeBooking({
      ...booking.toJSON(),
      class: classItem ? classItem.toJSON() : booking.class,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function cancelReservation(userId, reservationId) {
  return cancelReservationInternal({
    reservationId,
    actorId: userId,
    requesterUserId: userId,
    enforceOwner: true,
  });
}

export async function cancelReservationAsAdmin(reservationId, actorId) {
  return cancelReservationInternal({
    reservationId,
    actorId,
    enforceOwner: false,
  });
}

export async function cancelClassAndRefundCredits(classId, actorId) {
  const transaction = await sequelize.transaction();

  try {
    const classItem = await findClassById(classId, transaction);

    if (!classItem) {
      throw new ApiError(404, 'Class not found');
    }

    const activeBookings = await findActiveBookingsByClassId(classId, transaction);

    for (const booking of activeBookings) {
      booking.status = 'cancelled';
      booking.updatedBy = actorId;
      await booking.save({ transaction });

      const credit = await findOrCreateCreditByUserId(booking.userId, actorId, transaction, true);
      credit.balance += 1;
      credit.updatedBy = actorId;
      await credit.save({ transaction });
    }

    classItem.status = 'closed';
    classItem.bookedCount = 0;
    classItem.updatedBy = actorId;
    await classItem.save({ transaction });

    await transaction.commit();

    emitClassOccupancyUpdated(classItem);

    await invalidateFeaturedInstructorsCache();

    return {
      class: {
        id: classItem.id,
        name: classItem.name,
        status: classItem.status,
        bookedCount: classItem.bookedCount,
        capacity: classItem.capacity,
      },
      cancelledReservations: activeBookings.length,
    };
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