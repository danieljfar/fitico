import {
  createClassRecord,
  createInstructorRecord,
  deleteInstructorRecord,
  getClassReservations,
  getAdminDashboard,
  getClasses,
  getInstructors,
  updateInstructorRecord,
} from '../services/adminService.js';

export async function dashboard(req, res, next) {
  try {
    const metrics = await getAdminDashboard();
    return res.json({ metrics });
  } catch (error) {
    return next(error);
  }
}

export async function listInstructorsHandler(req, res, next) {
  try {
    const instructors = await getInstructors();
    return res.json({ instructors });
  } catch (error) {
    return next(error);
  }
}

export async function createInstructorHandler(req, res, next) {
  try {
    const instructor = await createInstructorRecord(req.body, req.user.id);
    return res.status(201).json({ instructor });
  } catch (error) {
    return next(error);
  }
}

export async function updateInstructorHandler(req, res, next) {
  try {
    const instructor = await updateInstructorRecord(req.params.instructorId, req.body, req.user.id);
    return res.json({ instructor });
  } catch (error) {
    return next(error);
  }
}

export async function deleteInstructorHandler(req, res, next) {
  try {
    await deleteInstructorRecord(req.params.instructorId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function listClassesHandler(req, res, next) {
  try {
    const classes = await getClasses();
    return res.json({ classes });
  } catch (error) {
    return next(error);
  }
}

export async function createClassHandler(req, res, next) {
  try {
    const classItem = await createClassRecord(req.body, req.user.id);
    return res.status(201).json({ class: classItem });
  } catch (error) {
    return next(error);
  }
}

export async function listClassReservationsHandler(req, res, next) {
  try {
    const reservations = await getClassReservations(req.params.classId);
    return res.json({ reservations });
  } catch (error) {
    return next(error);
  }
}
