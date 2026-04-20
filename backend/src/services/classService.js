import moment from 'moment';
import { ApiError } from '../utils/apiError.js';
import { findAllClasses } from '../repositories/classRepository.js';
import { deleteCacheKey, getJsonCache, setJsonCache } from '../config/redis.js';

const FEATURED_INSTRUCTORS_CACHE_KEY = 'public:classes:featured-instructors:v1';
const FEATURED_INSTRUCTORS_CACHE_TTL_SECONDS = 60 * 60 * 24;

function serializeClass(classItem) {
  const availableSeats = Math.max(classItem.capacity - classItem.bookedCount, 0);

  return {
    id: classItem.id,
    title: classItem.name,
    name: classItem.name,
    bikeLabel: classItem.bikeLabel,
    startsAt: classItem.startsAt,
    startsAtLabel: moment(classItem.startsAt).format('YYYY-MM-DD HH:mm'),
    capacity: classItem.capacity,
    bookedCount: classItem.bookedCount,
    availableSeats,
    status: classItem.status,
    isFull: availableSeats === 0,
    createdBy: classItem.createdBy,
    updatedBy: classItem.updatedBy,
    classId: classItem.id,
    class: {
      id: classItem.id,
      name: classItem.name,
      level: classItem.level,
      durationMinutes: classItem.durationMinutes,
      createdBy: classItem.createdBy,
      updatedBy: classItem.updatedBy,
      instructor: classItem.instructor
        ? {
            id: classItem.instructor.id,
            name: classItem.instructor.name,
            specialty: classItem.instructor.specialty,
            createdBy: classItem.instructor.createdBy,
            updatedBy: classItem.instructor.updatedBy,
          }
        : null,
    },
    createdAt: classItem.createdAt,
    updatedAt: classItem.updatedAt,
  };
}

export async function listClasses() {
  const classes = await findAllClasses();
  return classes.map(serializeClass);
}

export async function listFeaturedInstructorsByOccupancy(limit = 4) {
  const parsedLimit = Number(limit);
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 4;

  const cached = await getJsonCache(FEATURED_INSTRUCTORS_CACHE_KEY);
  if (Array.isArray(cached)) {
    return cached.slice(0, safeLimit);
  }

  const classes = await findAllClasses();
  const byInstructor = new Map();

  classes.forEach((classItem) => {
    const instructor = classItem.instructor;
    if (!instructor?.id) {
      return;
    }

    const key = instructor.id;
    if (!byInstructor.has(key)) {
      byInstructor.set(key, {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        specialty: instructor.specialty,
        bio: instructor.bio,
        status: instructor.status,
        classCount: 0,
        totalCapacity: 0,
        totalBooked: 0,
        occupancyRate: 0,
      });
    }

    const current = byInstructor.get(key);
    current.classCount += 1;
    current.totalCapacity += Number(classItem.capacity) || 0;
    current.totalBooked += Number(classItem.bookedCount) || 0;
  });

  const featured = Array.from(byInstructor.values())
    .map((instructor) => ({
      ...instructor,
      occupancyRate:
        instructor.totalCapacity > 0
          ? Math.round((instructor.totalBooked / instructor.totalCapacity) * 100)
          : 0,
    }))
    .sort((a, b) => {
      if (b.occupancyRate !== a.occupancyRate) {
        return b.occupancyRate - a.occupancyRate;
      }
      if (b.totalBooked !== a.totalBooked) {
        return b.totalBooked - a.totalBooked;
      }
      return a.name.localeCompare(b.name);
    });

  await setJsonCache(FEATURED_INSTRUCTORS_CACHE_KEY, featured, FEATURED_INSTRUCTORS_CACHE_TTL_SECONDS);

  return featured.slice(0, safeLimit);
}

export async function invalidateFeaturedInstructorsCache() {
  await deleteCacheKey(FEATURED_INSTRUCTORS_CACHE_KEY);
}

export function normalizeClass(classItem) {
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  return serializeClass(classItem);
}