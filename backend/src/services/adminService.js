import {
  countClassesByInstructorId,
  createClass,
  createInstructor,
  deleteInstructorById,
  findInstructorById,
  getDashboardMetrics,
  listClassReservations,
  listClasses,
  listInstructors,
  updateInstructorById,
} from '../repositories/adminRepository.js';
import { deleteCacheKey, getJsonCache, setJsonCache } from '../config/redis.js';
import { ApiError } from '../utils/apiError.js';

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

  return serializeClass(created || classItem);
}
