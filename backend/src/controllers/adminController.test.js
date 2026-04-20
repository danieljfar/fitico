import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminServiceMock = {
  assignCreditsToUser: vi.fn(),
  cancelClassRecord: vi.fn(),
  cancelReservationByAdminRecord: vi.fn(),
  createReservationForUserRecord: vi.fn(),
  createClassRecord: vi.fn(),
  createInstructorRecord: vi.fn(),
  deleteInstructorRecord: vi.fn(),
  getClassReservations: vi.fn(),
  getAdminDashboard: vi.fn(),
  getClasses: vi.fn(),
  getInstructors: vi.fn(),
  searchUsersForAdmin: vi.fn(),
  updateUserCreditsRecord: vi.fn(),
  updateClassRecord: vi.fn(),
  updateInstructorRecord: vi.fn(),
};

vi.mock('../services/adminService.js', () => adminServiceMock);

const {
  assignCreditsHandler,
  createClassHandler,
  createInstructorHandler,
  dashboard,
  deleteInstructorHandler,
  listClassReservationsHandler,
  listInstructorsHandler,
  updateUserCreditsHandler,
} = await import('./adminController.js');

function createRes() {
  return {
    json: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('adminController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns dashboard metrics', async () => {
    adminServiceMock.getAdminDashboard.mockResolvedValueOnce({ users: 10 });
    const req = {};
    const res = createRes();
    const next = vi.fn();

    await dashboard(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ metrics: { users: 10 } });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards dashboard errors to next', async () => {
    const error = new Error('boom');
    adminServiceMock.getAdminDashboard.mockRejectedValueOnce(error);
    const res = createRes();
    const next = vi.fn();

    await dashboard({}, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('lists instructors', async () => {
    adminServiceMock.getInstructors.mockResolvedValueOnce([{ id: 1 }]);
    const res = createRes();

    await listInstructorsHandler({}, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ instructors: [{ id: 1 }] });
  });

  it('creates instructor with 201 status', async () => {
    adminServiceMock.createInstructorRecord.mockResolvedValueOnce({ id: 2, name: 'Ana' });
    const req = { body: { name: 'Ana' }, user: { id: 77 } };
    const res = createRes();

    await createInstructorHandler(req, res, vi.fn());

    expect(adminServiceMock.createInstructorRecord).toHaveBeenCalledWith(req.body, 77);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ instructor: { id: 2, name: 'Ana' } });
  });

  it('creates class with 201 status', async () => {
    adminServiceMock.createClassRecord.mockResolvedValueOnce({ id: 5, name: 'Strength Lab' });
    const req = { body: { name: 'Strength Lab' }, user: { id: 77 } };
    const res = createRes();

    await createClassHandler(req, res, vi.fn());

    expect(adminServiceMock.createClassRecord).toHaveBeenCalledWith(req.body, 77);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ class: { id: 5, name: 'Strength Lab' } });
  });

  it('deletes instructor with 204 status', async () => {
    adminServiceMock.deleteInstructorRecord.mockResolvedValueOnce(undefined);
    const req = { params: { instructorId: '9' } };
    const res = createRes();

    await deleteInstructorHandler(req, res, vi.fn());

    expect(adminServiceMock.deleteInstructorRecord).toHaveBeenCalledWith('9');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('returns class reservations', async () => {
    adminServiceMock.getClassReservations.mockResolvedValueOnce([{ id: 1 }]);
    const req = { params: { classId: '6' } };
    const res = createRes();

    await listClassReservationsHandler(req, res, vi.fn());

    expect(adminServiceMock.getClassReservations).toHaveBeenCalledWith('6');
    expect(res.json).toHaveBeenCalledWith({ reservations: [{ id: 1 }] });
  });

  it('updates user credits and returns user payload', async () => {
    adminServiceMock.updateUserCreditsRecord.mockResolvedValueOnce({ id: 11, credits: 9 });
    const req = {
      params: { userId: '11' },
      body: { operation: 'add', amount: 1 },
      user: { id: 99 },
    };
    const res = createRes();

    await updateUserCreditsHandler(req, res, vi.fn());

    expect(adminServiceMock.updateUserCreditsRecord).toHaveBeenCalledWith('11', req.body, 99);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 11, credits: 9 } });
  });

  it('assigns credits and returns user payload', async () => {
    adminServiceMock.assignCreditsToUser.mockResolvedValueOnce({ id: 11, credits: 10 });
    const req = { body: { userId: 11, units: 5 }, user: { id: 99 } };
    const res = createRes();

    await assignCreditsHandler(req, res, vi.fn());

    expect(adminServiceMock.assignCreditsToUser).toHaveBeenCalledWith(req.body, 99);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 11, credits: 10 } });
  });
});
