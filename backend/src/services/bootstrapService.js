import moment from 'moment';
import { ClassModel } from '../database/index.js';
import { createInstructor, listInstructors } from '../repositories/adminRepository.js';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';
import { countClasses, createClasses } from '../repositories/classRepository.js';
import bcrypt from 'bcrypt';

const SYSTEM_USER_EMAIL = 'system@fitico.local';

const DEMO_INSTRUCTORS = [
  {
    name: 'Sofía Herrera',
    email: 'sofia.herrera@fitico.local',
    specialty: 'HIIT y resistencia',
    bio: 'Especialista en clases de alta intensidad y acondicionamiento funcional.',
  },
  {
    name: 'Mateo Rivas',
    email: 'mateo.rivas@fitico.local',
    specialty: 'Movilidad y recuperación',
    bio: 'Enfocado en movilidad, control postural y recuperación activa.',
  },
  {
    name: 'Lucía Navarro',
    email: 'lucia.navarro@fitico.local',
    specialty: 'Fuerza y técnica',
    bio: 'Trabaja fuerza básica, progresión técnica y mejora de rendimiento.',
  },
];

async function ensureInstructors() {
  const existingInstructors = await listInstructors();

  if (existingInstructors.length > 0) {
    return existingInstructors;
  }

  for (const instructor of DEMO_INSTRUCTORS) {
    await createInstructor({
      ...instructor,
      status: 'active',
      createdBy: null,
      updatedBy: null,
    });
  }

  return listInstructors();
}

async function ensureSystemUser() {
  const existingUser = await findUserByEmail(SYSTEM_USER_EMAIL);

  if (existingUser) {
    return existingUser;
  }

  const passwordHash = await bcrypt.hash('change-me-in-production', 12);

  return createUser({
    name: 'Fitico System',
    email: SYSTEM_USER_EMAIL,
    passwordHash,
    role: 'admin',
  });
}

async function assignMissingClassInstructors(instructors) {
  if (instructors.length === 0) {
    return;
  }

  const unassignedClasses = await ClassModel.findAll({
    where: { instructorId: null },
    order: [['id', 'ASC']],
  });

  if (unassignedClasses.length === 0) {
    return;
  }

  for (let index = 0; index < unassignedClasses.length; index += 1) {
    const classItem = unassignedClasses[index];
    const instructor = instructors[index % instructors.length];

    classItem.instructorId = instructor.id;
    await classItem.save();
  }
}

export async function ensureSeedData() {
  const systemUser = await ensureSystemUser();
  const instructors = await ensureInstructors();
  await assignMissingClassInstructors(instructors);

  const existingClassCount = await countClasses();

  if (existingClassCount > 0) {
    return;
  }

  const startsAtBase = moment().add(1, 'day').startOf('day');
  const demoClasses = [
    { name: 'Strength Lab', startsAt: startsAtBase.clone().hour(8).toDate(), capacity: 12, instructorId: instructors[0].id, createdBy: systemUser.id, updatedBy: systemUser.id },
    { name: 'Mobility Reset', startsAt: startsAtBase.clone().hour(10).toDate(), capacity: 8, instructorId: instructors[1 % instructors.length].id, createdBy: systemUser.id, updatedBy: systemUser.id },
    { name: 'Lunch HIIT', startsAt: startsAtBase.clone().hour(13).toDate(), capacity: 16, instructorId: instructors[2 % instructors.length].id, createdBy: systemUser.id, updatedBy: systemUser.id },
    { name: 'Evening Recovery', startsAt: startsAtBase.clone().hour(18).toDate(), capacity: 10, instructorId: instructors[0].id, createdBy: systemUser.id, updatedBy: systemUser.id },
    {
      name: 'Weekend Deep Focus',
      startsAt: startsAtBase.clone().add(1, 'day').hour(9).toDate(),
      capacity: 20,
      instructorId: instructors[1 % instructors.length].id,
      createdBy: systemUser.id,
      updatedBy: systemUser.id,
    },
  ];

  await createClasses(demoClasses);
}