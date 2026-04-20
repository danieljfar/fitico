import { beforeEach, describe, expect, it, vi } from 'vitest';

const classRepositoryMock = {
  findAllClasses: vi.fn(),
};

const redisMock = {
  deleteCacheKey: vi.fn(),
  getJsonCache: vi.fn(),
  setJsonCache: vi.fn(),
};

vi.mock('../repositories/classRepository.js', () => classRepositoryMock);
vi.mock('../config/redis.js', () => redisMock);

const { ApiError } = await import('../utils/apiError.js');
const {
  invalidateFeaturedInstructorsCache,
  listClasses,
  listFeaturedInstructorsByOccupancy,
  normalizeClass,
} = await import('./classService.js');

describe('classService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes class list with computed seats and nested instructor', async () => {
    classRepositoryMock.findAllClasses.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Strength Lab',
        bikeLabel: 'B1',
        startsAt: new Date('2026-04-20T08:00:00.000Z'),
        capacity: 10,
        bookedCount: 4,
        status: 'open',
        createdBy: 1,
        updatedBy: 1,
        level: 'beginner',
        durationMinutes: 45,
        instructor: {
          id: 5,
          name: 'Coach Ana',
          specialty: 'HIIT',
          createdBy: 1,
          updatedBy: 1,
        },
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
        updatedAt: new Date('2026-04-19T08:00:00.000Z'),
      },
    ]);

    const result = await listClasses();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      title: 'Strength Lab',
      availableSeats: 6,
      isFull: false,
      class: {
        instructor: {
          id: 5,
          name: 'Coach Ana',
        },
      },
    });
    expect(result[0].startsAtLabel).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('returns featured instructors from cache when available', async () => {
    redisMock.getJsonCache.mockResolvedValueOnce([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);

    const result = await listFeaturedInstructorsByOccupancy(1);

    expect(result).toEqual([{ id: 1, name: 'A' }]);
    expect(classRepositoryMock.findAllClasses).not.toHaveBeenCalled();
    expect(redisMock.setJsonCache).not.toHaveBeenCalled();
  });

  it('builds featured instructors by occupancy and caches result', async () => {
    redisMock.getJsonCache.mockResolvedValueOnce(null);
    classRepositoryMock.findAllClasses.mockResolvedValueOnce([
      {
        capacity: 10,
        bookedCount: 8,
        instructor: { id: 1, name: 'A', email: 'a@fitico.io', specialty: 'HIIT', bio: null, status: 'active' },
      },
      {
        capacity: 10,
        bookedCount: 10,
        instructor: { id: 2, name: 'B', email: 'b@fitico.io', specialty: 'Yoga', bio: null, status: 'active' },
      },
      {
        capacity: 10,
        bookedCount: 2,
        instructor: { id: 1, name: 'A', email: 'a@fitico.io', specialty: 'HIIT', bio: null, status: 'active' },
      },
    ]);

    const result = await listFeaturedInstructorsByOccupancy(10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 2,
      occupancyRate: 100,
    });
    expect(result[1]).toMatchObject({
      id: 1,
      occupancyRate: 50,
    });

    expect(redisMock.setJsonCache).toHaveBeenCalledWith(
      'public:classes:featured-instructors:v1',
      expect.any(Array),
      86400
    );
  });

  it('invalidates featured instructors cache key', async () => {
    await invalidateFeaturedInstructorsCache();

    expect(redisMock.deleteCacheKey).toHaveBeenCalledWith('public:classes:featured-instructors:v1');
  });

  it('throws ApiError when normalizeClass receives null', () => {
    expect(() => normalizeClass(null)).toThrow(ApiError);
    expect(() => normalizeClass(null)).toThrow('Class not found');
  });
});
