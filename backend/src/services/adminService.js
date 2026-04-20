import {
  countClassesByInstructorId,
  createClass,
  createInstructor,
  deleteInstructorById,
  findClassById,
  findInstructorById,
  findUserWithCreditById,
  getDashboardMetrics,
  listClassReservations,
  listClasses,
  listInstructors,
  searchUsers,
  updateClassById,
  updateInstructorById,
} from '../repositories/adminRepository.js';
import { deleteCacheKey, getJsonCache, setJsonCache } from '../config/redis.js';
import { ApiError } from '../utils/apiError.js';
import { findOrCreateCreditByUserId } from '../repositories/creditRepository.js';
import { sequelize } from '../database/index.js';
import {
  cancelClassAndRefundCredits,
  cancelReservationAsAdmin,
  reserveClassAsAdmin,
} from './reservationService.js';
import { invalidateFeaturedInstructorsCache } from './classService.js';

const INSTRUCTORS_CACHE_KEY = 'admin:instructors:list';

function serializeInstructor(instructor) {
  return {
    id: instructor.id,
    name: instructor.name,
    email: instructor.email,
    specialty: instructor.specialty,
    bio: instructor.bio,
    status: instructor.status,
    createdBy: instructor.createdBy,
    updatedBy: instructor.updatedBy,
    createdAt: instructor.createdAt,
    updatedAt: instructor.updatedAt,
  };
}

function serializeClass(classItem) {
  const instructor = classItem.instructor || null;

  return {
    id: classItem.id,
    title: classItem.name,
    name: classItem.name,
    description: classItem.description,
    bikeLabel: classItem.bikeLabel,
    startsAt: classItem.startsAt,
    level: classItem.level,
    durationMinutes: classItem.durationMinutes,
    capacity: classItem.capacity,
    bookedCount: classItem.bookedCount,
    status: classItem.status,
    instructorId: classItem.instructorId,
    createdBy: classItem.createdBy,
    updatedBy: classItem.updatedBy,
    classId: classItem.id,
    instructor: instructor
      ? {
          id: instructor.id,
          name: instructor.name,
          specialty: instructor.specialty,
          status: instructor.status,
          createdBy: instructor.createdBy,
          updatedBy: instructor.updatedBy,
        }
      : null,
    createdAt: classItem.createdAt,
    updatedAt: classItem.updatedAt,
  };
}

function serializeReservation(reservation) {
  return {
    id: reservation.id,
    status: reservation.status,
    userId: reservation.userId,
    classId: reservation.classId,
    externalBookingId: reservation.externalBookingId,
    createdBy: reservation.createdBy,
    updatedBy: reservation.updatedBy,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    user: reservation.user
      ? {
          id: reservation.user.id,
          name: reservation.user.name,
          email: reservation.user.email,
          role: reservation.user.role,
        }
      : null,
    class: reservation.class
      ? serializeClass(reservation.class)
      : null,
  };
}

export async function getAdminDashboard() {
  return getDashboardMetrics();
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: Number(user.credit?.balance || 0),
  };
}

export async function getInstructors() {
  const cached = await getJsonCache(INSTRUCTORS_CACHE_KEY);

  if (Array.isArray(cached)) {
    return cached;
  }

  const instructors = await listInstructors();
  const serialized = instructors.map(serializeInstructor);

  await setJsonCache(INSTRUCTORS_CACHE_KEY, serialized);

  return serialized;
}

export async function createInstructorRecord(payload, actorId) {
  const name = payload?.name?.trim();

  if (!name) {
    throw new ApiError(400, 'Instructor name is required');
  }

  const instructor = await createInstructor({
    name,
    email: payload?.email?.trim() || null,
    specialty: payload?.specialty?.trim() || null,
    bio: payload?.bio?.trim() || null,
    status: payload?.status || 'active',
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
  });

  await deleteCacheKey(INSTRUCTORS_CACHE_KEY);
  await invalidateFeaturedInstructorsCache();

  return serializeInstructor(instructor);
}

export async function updateInstructorRecord(instructorId, payload, actorId) {
  const numericInstructorId = Number(instructorId);

  if (!Number.isInteger(numericInstructorId) || numericInstructorId <= 0) {
    throw new ApiError(400, 'Valid instructorId is required');
  }

  const updates = {};

  if (typeof payload?.name === 'string') {
    const trimmed = payload.name.trim();
    if (!trimmed) {
      throw new ApiError(400, 'Instructor name cannot be empty');
    }
    updates.name = trimmed;
  }

  if (typeof payload?.email === 'string') {
    updates.email = payload.email.trim() || null;
  }

  if (typeof payload?.specialty === 'string') {
    updates.specialty = payload.specialty.trim() || null;
  }

  if (typeof payload?.bio === 'string') {
    updates.bio = payload.bio.trim() || null;
  }

  if (typeof payload?.status === 'string') {
    updates.status = payload.status;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No fields were provided to update');
  }

  updates.updatedBy = actorId ?? null;

  const instructor = await updateInstructorById(numericInstructorId, updates);

  if (!instructor) {
    throw new ApiError(404, 'Instructor not found');
  }

  await deleteCacheKey(INSTRUCTORS_CACHE_KEY);
  await invalidateFeaturedInstructorsCache();

  return serializeInstructor(instructor);
}

export async function deleteInstructorRecord(instructorId) {
  const numericInstructorId = Number(instructorId);

  if (!Number.isInteger(numericInstructorId) || numericInstructorId <= 0) {
    throw new ApiError(400, 'Valid instructorId is required');
  }

  const instructor = await findInstructorById(numericInstructorId);

  if (!instructor) {
    throw new ApiError(404, 'Instructor not found');
  }

  const classesCount = await countClassesByInstructorId(numericInstructorId);

  if (classesCount > 0) {
    throw new ApiError(409, 'Cannot delete instructor with associated classes');
  }

  await deleteInstructorById(numericInstructorId);
  await deleteCacheKey(INSTRUCTORS_CACHE_KEY);
  await invalidateFeaturedInstructorsCache();

  return { deleted: true };
}

export async function getClasses() {
  const classes = await listClasses();
  return classes.map(serializeClass);
}

export async function getClassReservations(classId) {
  const numericClassId = Number(classId);

  if (!Number.isInteger(numericClassId) || numericClassId <= 0) {
    throw new ApiError(400, 'Valid classId is required');
  }

  const reservations = await listClassReservations(numericClassId);
  return reservations.map(serializeReservation);
}

export async function searchUsersForAdmin(query) {
  const users = await searchUsers(query, 20);
  return users.map(serializeUser);
}

export async function assignCreditsToUser(payload, actorId) {
  const userId = Number(payload?.userId);
  const units = Number(payload?.units);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(400, 'Valid userId is required');
  }

  if (![1, 5, 10].includes(units)) {
    throw new ApiError(400, 'units must be one of: 1, 5, 10');
  }

  return updateUserCreditsRecord(userId, { operation: 'add', amount: units }, actorId);
}

export async function updateUserCreditsRecord(userIdInput, payload, actorId) {
  const userId = Number(userIdInput);
  const operation = typeof payload?.operation === 'string' ? payload.operation : 'add';
  const amount = Number(payload?.amount);
  const value = Number(payload?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(400, 'Valid userId is required');
  }

  if (!['add', 'subtract', 'set'].includes(operation)) {
    throw new ApiError(400, 'operation must be one of: add, subtract, set');
  }

  if (operation === 'set') {
    if (!Number.isInteger(value) || value < 0) {
      throw new ApiError(400, 'value must be an integer greater than or equal to 0');
    }
  } else if (!Number.isInteger(amount) || amount <= 0) {
    throw new ApiError(400, 'amount must be an integer greater than 0');
  }

  const existingUser = await findUserWithCreditById(userId);

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  const transaction = await sequelize.transaction();

  try {
    const credit = await findOrCreateCreditByUserId(userId, actorId, transaction, true);

    if (operation === 'add') {
      credit.balance += amount;
    } else if (operation === 'subtract') {
      if (credit.balance < amount) {
        throw new ApiError(409, 'Cannot subtract more credits than current balance');
      }
      credit.balance -= amount;
    } else {
      credit.balance = value;
    }

    credit.updatedBy = actorId ?? null;
    await credit.save({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const user = await findUserWithCreditById(userId);

  if (!user || user.id !== userId) {
    throw new ApiError(404, 'User not found');
  }

  return serializeUser(user);
}

export async function createClassRecord(payload, actorId) {
  const name = payload?.name?.trim();
  const instructorId = Number(payload?.instructorId);

  if (!name) {
    throw new ApiError(400, 'Class name is required');
  }

  if (!Number.isInteger(instructorId) || instructorId <= 0) {
    throw new ApiError(400, 'Valid instructorId is required');
  }

  const classItem = await createClass({
    name,
    description: payload?.description?.trim() || null,
    level: payload?.level || 'beginner',
    durationMinutes: Number(payload?.durationMinutes) || 45,
    status: payload?.status || 'open',
    instructorId,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
    bikeLabel: payload?.bikeLabel?.trim() || null,
    startsAt: payload?.startsAt || null,
    capacity: Number(payload?.capacity) || null,
    bookedCount: Number(payload?.bookedCount) || 0,
  });

  const classes = await listClasses();
  const created = classes.find((item) => item.id === classItem.id);

  await invalidateFeaturedInstructorsCache();

  return serializeClass(created || classItem);
}

export async function updateClassRecord(classId, payload, actorId) {
  const numericClassId = Number(classId);

  if (!Number.isInteger(numericClassId) || numericClassId <= 0) {
    throw new ApiError(400, 'Valid classId is required');
  }

  const updates = {};

  if (typeof payload?.name === 'string') {
    const trimmed = payload.name.trim();
    if (!trimmed) {
      throw new ApiError(400, 'Class name cannot be empty');
    }
    updates.name = trimmed;
  }

  if (typeof payload?.description === 'string') {
    updates.description = payload.description.trim() || null;
  }

  if (typeof payload?.level === 'string') {
    updates.level = payload.level;
  }

  if (payload?.durationMinutes !== undefined) {
    updates.durationMinutes = Number(payload.durationMinutes) || 45;
  }

  if (payload?.instructorId !== undefined) {
    updates.instructorId = Number(payload.instructorId);
  }

  if (payload?.capacity !== undefined) {
    updates.capacity = Number(payload.capacity) || null;
  }

  if (typeof payload?.bikeLabel === 'string') {
    updates.bikeLabel = payload.bikeLabel.trim() || null;
  }

  if (payload?.startsAt !== undefined) {
    updates.startsAt = payload.startsAt || null;
  }

  if (typeof payload?.status === 'string') {
    updates.status = payload.status;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No fields were provided to update');
  }

  updates.updatedBy = actorId ?? null;

  const classItem = await updateClassById(numericClassId, updates);

  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  await invalidateFeaturedInstructorsCache();

  return serializeClass(classItem);
}

export async function cancelClassRecord(classId, actorId) {
  const numericClassId = Number(classId);

  if (!Number.isInteger(numericClassId) || numericClassId <= 0) {
    throw new ApiError(400, 'Valid classId is required');
  }

  return cancelClassAndRefundCredits(numericClassId, actorId);
}

export async function createReservationForUserRecord(classId, userId, actorId) {
  const numericClassId = Number(classId);
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericClassId) || numericClassId <= 0) {
    throw new ApiError(400, 'Valid classId is required');
  }

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    throw new ApiError(400, 'Valid userId is required');
  }

  const classItem = await findClassById(numericClassId);

  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  const booking = await reserveClassAsAdmin(numericUserId, numericClassId, actorId);

  return {
    reservation: booking,
    booking,
  };
}

export async function cancelReservationByAdminRecord(reservationId, actorId) {
  const numericReservationId = Number(reservationId);

  if (!Number.isInteger(numericReservationId) || numericReservationId <= 0) {
    throw new ApiError(400, 'Valid reservationId is required');
  }

  const booking = await cancelReservationAsAdmin(numericReservationId, actorId);

  return {
    reservation: booking,
    booking,
  };
}
