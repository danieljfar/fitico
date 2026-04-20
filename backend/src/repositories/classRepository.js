import { ClassModel, Instructor } from '../database/index.js';

const CLASS_INCLUDES = [
  {
    model: Instructor,
    as: 'instructor',
    attributes: ['id', 'name', 'email', 'specialty', 'bio', 'status', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'],
  },
];

export function findAllClasses() {
  return ClassModel.findAll({
    include: CLASS_INCLUDES,
    order: [['startsAt', 'ASC']],
  });
}

export function findClassById(classId, transaction) {
  const include = transaction ? undefined : CLASS_INCLUDES;

  return ClassModel.findByPk(classId, {
    include,
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
}

export function createClasses(classes) {
  return ClassModel.bulkCreate(classes);
}

export function createClass(classData) {
  return ClassModel.create(classData);
}

export function countClasses() {
  return ClassModel.count();
}