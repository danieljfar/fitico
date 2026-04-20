import { beforeEach, describe, expect, it, vi } from 'vitest';

const classServiceMock = {
  listClasses: vi.fn(),
  listFeaturedInstructorsByOccupancy: vi.fn(),
};

vi.mock('../services/classService.js', () => classServiceMock);

const { getClasses, getFeaturedInstructors } = await import('./classController.js');

function createRes() {
  return {
    json: vi.fn(),
  };
}

function flushPromises() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('classController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns public classes', async () => {
    classServiceMock.listClasses.mockResolvedValueOnce([{ id: 1 }]);
    const res = createRes();

    getClasses({}, res, vi.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith({ classes: [{ id: 1 }] });
  });

  it('returns featured instructors using query limit', async () => {
    classServiceMock.listFeaturedInstructorsByOccupancy.mockResolvedValueOnce([{ id: 2 }]);
    const req = { query: { limit: '3' } };
    const res = createRes();

    getFeaturedInstructors(req, res, vi.fn());
    await flushPromises();

    expect(classServiceMock.listFeaturedInstructorsByOccupancy).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith({ instructors: [{ id: 2 }] });
  });
});
