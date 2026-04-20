import { beforeEach, describe, expect, it, vi } from 'vitest';

const reservationServiceMock = {
  cancelReservation: vi.fn(),
  listReservations: vi.fn(),
  reserveClass: vi.fn(),
};

vi.mock('../services/reservationService.js', () => reservationServiceMock);

const { createReservation, deleteReservation, getMyReservations } = await import('./reservationController.js');

function createRes() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

function flushPromises() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('reservationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates reservation and aliases booking payload', async () => {
    reservationServiceMock.reserveClass.mockResolvedValueOnce({ id: 33, classId: 8 });
    const req = { user: { id: 7 }, body: { classId: '8' } };
    const res = createRes();

    createReservation(req, res, vi.fn());
    await flushPromises();

    expect(reservationServiceMock.reserveClass).toHaveBeenCalledWith(7, 8);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      booking: { id: 33, classId: 8 },
      reservation: { id: 33, classId: 8 },
    });
  });

  it('returns my reservations under both keys', async () => {
    reservationServiceMock.listReservations.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    const req = { user: { id: 20 } };
    const res = createRes();

    getMyReservations(req, res, vi.fn());
    await flushPromises();

    expect(reservationServiceMock.listReservations).toHaveBeenCalledWith(20);
    expect(res.json).toHaveBeenCalledWith({
      bookings: [{ id: 1 }, { id: 2 }],
      reservations: [{ id: 1 }, { id: 2 }],
    });
  });

  it('deletes reservation and returns payload aliases', async () => {
    reservationServiceMock.cancelReservation.mockResolvedValueOnce({ id: 10, status: 'cancelled' });
    const req = { user: { id: 99 }, params: { id: '10' } };
    const res = createRes();

    deleteReservation(req, res, vi.fn());
    await flushPromises();

    expect(reservationServiceMock.cancelReservation).toHaveBeenCalledWith(99, 10);
    expect(res.json).toHaveBeenCalledWith({
      booking: { id: 10, status: 'cancelled' },
      reservation: { id: 10, status: 'cancelled' },
    });
  });
});
