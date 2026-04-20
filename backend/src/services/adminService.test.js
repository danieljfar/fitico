import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminRepositoryMock = {
  countClassesByInstructorId: vi.fn(),
  createClass: vi.fn(),
  createInstructor: vi.fn(),
  deleteInstructorById: vi.fn(),
  findClassById: vi.fn(),
  findInstructorById: vi.fn(),
  findUserWithCreditById: vi.fn(),
  getDashboardMetrics: vi.fn(),
  listClassReservations: vi.fn(),
  listClasses: vi.fn(),
  listInstructors: vi.fn(),
  searchUsers: vi.fn(),
  updateClassById: vi.fn(),
  updateInstructorById: vi.fn(),
};

const redisMock = {
  deleteCacheKey: vi.fn(),
  getJsonCache: vi.fn(),
  setJsonCache: vi.fn(),
};

const creditRepositoryMock = {
  findOrCreateCreditByUserId: vi.fn(),
};

const classServiceMock = {
  invalidateFeaturedInstructorsCache: vi.fn(),
};

vi.mock('../repositories/adminRepository.js', () => adminRepositoryMock);
vi.mock('../config/redis.js', () => redisMock);
vi.mock('../repositories/creditRepository.js', () => creditRepositoryMock);
vi.mock('../database/index.js', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));
vi.mock('./reservationService.js', () => ({
  cancelClassAndRefundCredits: vi.fn(),
  cancelReservationAsAdmin: vi.fn(),
  reserveClassAsAdmin: vi.fn(),
}));
vi.mock('./classService.js', () => classServiceMock);

const { ApiError } = await import('../utils/apiError.js');
const {
  createInstructorRecord,
  getClassReservations,
  getInstructors,
} = await import('./adminService.js');

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClassReservations', () => {
    it('throws ApiError when classId is invalid', async () => {
      await expect(getClassReservations('bad-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Valid classId is required',
      });

      expect(adminRepositoryMock.listClassReservations).not.toHaveBeenCalled();
    });

    it('maps reservation payload including nested user and class', async () => {
      adminRepositoryMock.listClassReservations.mockResolvedValueOnce([
        {
          id: 11,
          status: 'active',
          userId: 7,
          classId: 3,
          externalBookingId: null,
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date('2026-04-19T10:00:00.000Z'),
          updatedAt: new Date('2026-04-19T10:00:00.000Z'),
          user: {
            id: 7,
            name: 'Jane Doe',
            email: 'jane@example.com',
            role: 'member',
          },
          class: {
            id: 3,
            name: 'Strength Lab',
            description: 'Strength class',
            bikeLabel: 'B1',
            startsAt: new Date('2026-04-20T08:00:00.000Z'),
            level: 'beginner',
            durationMinutes: 45,
            capacity: 12,
            bookedCount: 4,
            status: 'open',
            instructorId: 9,
            createdBy: 1,
            updatedBy: 1,
            createdAt: new Date('2026-04-19T08:00:00.000Z'),
            updatedAt: new Date('2026-04-19T08:00:00.000Z'),
            instructor: {
              id: 9,
              name: 'Coach Ana',
              specialty: 'HIIT',
              status: 'active',
              createdBy: 1,
              updatedBy: 1,
            },
          },
        },
      ]);

      const reservations = await getClassReservations('3');

      expect(adminRepositoryMock.listClassReservations).toHaveBeenCalledWith(3);
      expect(reservations).toHaveLength(1);
      expect(reservations[0]).toMatchObject({
        id: 11,
        status: 'active',
        user: {
          id: 7,
          name: 'Jane Doe',
        },
        class: {
          id: 3,
          name: 'Strength Lab',
          instructor: {
            id: 9,
            name: 'Coach Ana',
          },
        },
      });
    });
  });

  describe('createInstructorRecord', () => {
    it('throws ApiError when name is missing', async () => {
      const action = createInstructorRecord({}, 1);

      await expect(action).rejects.toBeInstanceOf(ApiError);
      await expect(action).rejects.toMatchObject({
        statusCode: 400,
        message: 'Instructor name is required',
      });

      expect(adminRepositoryMock.createInstructor).not.toHaveBeenCalled();
    });

    it('creates instructor using trimmed payload and invalidates caches', async () => {
      adminRepositoryMock.createInstructor.mockResolvedValueOnce({
        id: 10,
        name: 'Ana Ruiz',
        email: 'ana@fitico.io',
        specialty: 'Mobility',
        bio: 'Coach',
        status: 'active',
        createdBy: 99,
        updatedBy: 99,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-19T10:00:00.000Z'),
      });

      const result = await createInstructorRecord(
        {
          name: '  Ana Ruiz  ',
          email: '  ana@fitico.io  ',
          specialty: '  Mobility  ',
          bio: '  Coach  ',
        },
        99
      );

      expect(adminRepositoryMock.createInstructor).toHaveBeenCalledWith({
        name: 'Ana Ruiz',
        email: 'ana@fitico.io',
        specialty: 'Mobility',
        bio: 'Coach',
        status: 'active',
        createdBy: 99,
        updatedBy: 99,
      });
      expect(redisMock.deleteCacheKey).toHaveBeenCalledWith('admin:instructors:list');
      expect(classServiceMock.invalidateFeaturedInstructorsCache).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        id: 10,
        name: 'Ana Ruiz',
      });
    });
  });

  describe('getInstructors', () => {
    it('returns instructors from cache when present', async () => {
      const cached = [{ id: 1, name: 'Cached Coach' }];
      redisMock.getJsonCache.mockResolvedValueOnce(cached);

      const result = await getInstructors();

      expect(result).toEqual(cached);
      expect(adminRepositoryMock.listInstructors).not.toHaveBeenCalled();
      expect(redisMock.setJsonCache).not.toHaveBeenCalled();
    });

    it('loads instructors from repository and caches serialized result', async () => {
      redisMock.getJsonCache.mockResolvedValueOnce(null);
      adminRepositoryMock.listInstructors.mockResolvedValueOnce([
        {
          id: 2,
          name: 'Repo Coach',
          email: 'coach@fitico.io',
          specialty: null,
          bio: null,
          status: 'active',
          createdBy: null,
          updatedBy: null,
          createdAt: new Date('2026-04-19T10:00:00.000Z'),
          updatedAt: new Date('2026-04-19T10:00:00.000Z'),
        },
      ]);

      const result = await getInstructors();

      expect(adminRepositoryMock.listInstructors).toHaveBeenCalledTimes(1);
      expect(redisMock.setJsonCache).toHaveBeenCalledWith('admin:instructors:list', result);
      expect(result).toMatchObject([
        {
          id: 2,
          name: 'Repo Coach',
        },
      ]);
    });
  });
});
