import { Op } from 'sequelize';
import { Booking, ClassModel, Credit, Instructor, User, sequelize } from '../database/index.js';

const CLASS_INCLUDES = [
  {
    model: Instructor,
    as: 'instructor',
    attributes: ['id', 'name', 'specialty', 'status', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'],
  },
];

export function listInstructors() {
  return Instructor.findAll({ order: [['name', 'ASC']] });
}

export function createInstructor(data) {
  return Instructor.create(data);
}

export function findInstructorById(id) {
  return Instructor.findByPk(id);
}

export async function updateInstructorById(id, data) {
  const instructor = await Instructor.findByPk(id);

  if (!instructor) {
    return null;
  }

  await instructor.update(data);
  return instructor;
}

export async function deleteInstructorById(id) {
  const instructor = await Instructor.findByPk(id);

  if (!instructor) {
    return false;
  }

  await instructor.destroy();
  return true;
}

export function countClassesByInstructorId(instructorId) {
  return ClassModel.count({ where: { instructorId } });
}

export function listClasses() {
  return ClassModel.findAll({
    include: CLASS_INCLUDES,
    order: [['createdAt', 'DESC']],
  });
}

export function createClass(data) {
  return ClassModel.create(data);
}

export function findClassById(classId, transaction) {
  return ClassModel.findByPk(classId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
    include: CLASS_INCLUDES,
  });
}

export async function updateClassById(classId, data) {
  const classItem = await ClassModel.findByPk(classId);

  if (!classItem) {
    return null;
  }

  await classItem.update(data);

  return ClassModel.findByPk(classId, {
    include: CLASS_INCLUDES,
  });
}

export function searchUsers(query, limit = 20) {
  const sanitized = (query || '').trim();
  const where = sanitized
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${sanitized}%` } },
          { email: { [Op.like]: `%${sanitized}%` } },
        ],
      }
    : undefined;

  return User.findAll({
    where,
    include: [
      {
        model: Credit,
        as: 'credit',
        required: false,
        attributes: ['balance'],
      },
    ],
    order: [['name', 'ASC']],
    limit,
  });
}

export function findUserWithCreditById(userId) {
  return User.findByPk(userId, {
    include: [
      {
        model: Credit,
        as: 'credit',
        required: false,
        attributes: ['balance'],
      },
    ],
  });
}

const RESERVATION_INCLUDES = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'name', 'email', 'role'],
  },
  {
    model: ClassModel,
    as: 'class',
    include: CLASS_INCLUDES,
  },
];

export function listClassReservations(classId) {
  return Booking.findAll({
    where: { classId },
    include: RESERVATION_INCLUDES,
    order: [['createdAt', 'DESC']],
  });
}

export async function getDashboardMetrics() {
  const [users, instructors, classes, activeBookings, seatStats] = await Promise.all([
    User.count(),
    Instructor.count(),
    ClassModel.count(),
    Booking.count({ where: { status: 'active' } }),
    ClassModel.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('capacity')), 'totalCapacity'],
        [sequelize.fn('SUM', sequelize.col('booked_count')), 'totalBooked'],
      ],
      raw: true,
    }),
  ]);

  const totalCapacity = Number(seatStats?.[0]?.totalCapacity || 0);
  const totalBooked = Number(seatStats?.[0]?.totalBooked || 0);

  return {
    users,
    instructors,
    classes,
    activeBookings,
    totalCapacity,
    totalBooked,
    occupancyRate: totalCapacity > 0 ? Number(((totalBooked / totalCapacity) * 100).toFixed(2)) : 0,
  };
}
