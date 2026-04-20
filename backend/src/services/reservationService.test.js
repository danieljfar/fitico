import { beforeEach, describe, expect, it, vi } from 'vitest';

const transactionMock = {
  commit: vi.fn(),
  rollback: vi.fn(),
};

const databaseMock = {
  sequelize: {
    transaction: vi.fn(),
  },
};

const socketMock = {
  emitSocketEvent: vi.fn(),
};

const reservationRepositoryMock = {
  createBooking: vi.fn(),
  findActiveBooking: vi.fn(),
  findActiveBookingsByClassId: vi.fn(),
  findBookingById: vi.fn(),
  findUserBookings: vi.fn(),
};

const classRepositoryMock = {
  findClassById: vi.fn(),
};

const creditRepositoryMock = {
  findOrCreateCreditByUserId: vi.fn(),
};

const classServiceMock = {
  invalidateFeaturedInstructorsCache: vi.fn(),
};

vi.mock('../database/index.js', () => databaseMock);
vi.mock('../config/socket.js', () => socketMock);
vi.mock('../repositories/reservationRepository.js', () => reservationRepositoryMock);
vi.mock('../repositories/classRepository.js', () => classRepositoryMock);
vi.mock('../repositories/creditRepository.js', () => creditRepositoryMock);
vi.mock('./classService.js', () => classServiceMock);

const {
  cancelClassAndRefundCredits,
  cancelReservation,
  listReservations,
  reserveClass,
} = await import('./reservationService.js');

describe('reservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMock.sequelize.transaction.mockResolvedValue(transactionMock);
  });

  it('reserves class, consumes credit and emits class update', async () => {
    const classItem = {
      id: 50,
      name: 'Mobility',
      capacity: 10,
      bookedCount: 2,
      instructorId: 1,
      createdBy: 1,
      updatedBy: 1,
      save: vi.fn(),
      toJSON: vi.fn().mockReturnValue({
        id: 50,
        name: 'Mobility',
        capacity: 10,
        bookedCount: 3,
      }),
    };

    const credit = {
      balance: 2,
      updatedBy: null,
      save: vi.fn(),
    };

    reservationRepositoryMock.findActiveBooking.mockResolvedValueOnce(null);
    classRepositoryMock.findClassById.mockResolvedValueOnce(classItem);
    creditRepositoryMock.findOrCreateCreditByUserId.mockResolvedValueOnce(credit);
    reservationRepositoryMock.createBooking.mockResolvedValueOnce({
      toJSON: () => ({
        id: 999,
        status: 'active',
        userId: 7,
        classId: 50,
      }),
    });

    const result = await reserveClass(7, 50);

    expect(credit.balance).toBe(1);
    expect(classItem.bookedCount).toBe(3);
    expect(transactionMock.commit).toHaveBeenCalledTimes(1);
    expect(socketMock.emitSocketEvent).toHaveBeenCalledWith('class_updated', {
      classId: 50,
      bookedCount: 3,
      capacity: 10,
    });
    expect(classServiceMock.invalidateFeaturedInstructorsCache).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 999,
      classId: 50,
      class: {
        id: 50,
      },
    });
  });

  it('rolls back when class does not exist on reserve', async () => {
    classRepositoryMock.findClassById.mockResolvedValueOnce(null);

    await expect(reserveClass(7, 50)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Class not found',
    });

    expect(transactionMock.rollback).toHaveBeenCalledTimes(1);
    expect(transactionMock.commit).not.toHaveBeenCalled();
  });

  it('forbids cancelling reservation from another user', async () => {
    reservationRepositoryMock.findBookingById.mockResolvedValueOnce({
      id: 12,
      userId: 999,
      status: 'active',
      classId: 50,
    });

    await expect(cancelReservation(7, 12)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You cannot cancel this booking',
    });

    expect(transactionMock.rollback).toHaveBeenCalledTimes(1);
  });

  it('cancels class and refunds all active bookings', async () => {
    const classItem = {
      id: 5,
      name: 'Strength Lab',
      status: 'open',
      bookedCount: 2,
      capacity: 12,
      updatedBy: null,
      save: vi.fn(),
    };

    const bookingA = {
      userId: 10,
      status: 'active',
      updatedBy: null,
      save: vi.fn(),
    };

    const bookingB = {
      userId: 20,
      status: 'active',
      updatedBy: null,
      save: vi.fn(),
    };

    classRepositoryMock.findClassById.mockResolvedValueOnce(classItem);
    reservationRepositoryMock.findActiveBookingsByClassId.mockResolvedValueOnce([bookingA, bookingB]);
    creditRepositoryMock.findOrCreateCreditByUserId
      .mockResolvedValueOnce({ balance: 0, updatedBy: null, save: vi.fn() })
      .mockResolvedValueOnce({ balance: 3, updatedBy: null, save: vi.fn() });

    const result = await cancelClassAndRefundCredits(5, 1);

    expect(classItem.status).toBe('closed');
    expect(classItem.bookedCount).toBe(0);
    expect(transactionMock.commit).toHaveBeenCalledTimes(1);
    expect(socketMock.emitSocketEvent).toHaveBeenCalledWith('class_updated', {
      classId: 5,
      bookedCount: 0,
      capacity: 12,
      status: 'closed',
    });
    expect(socketMock.emitSocketEvent).toHaveBeenCalledWith('slot_updated', {
      classId: 5,
      bookedCount: 0,
      capacity: 12,
      status: 'closed',
    });
    expect(result).toEqual({
      class: {
        id: 5,
        name: 'Strength Lab',
        status: 'closed',
        bookedCount: 0,
        capacity: 12,
      },
      cancelledReservations: 2,
    });
  });

  it('lists and serializes bookings for user', async () => {
    reservationRepositoryMock.findUserBookings.mockResolvedValueOnce([
      {
        id: 1,
        status: 'active',
        userId: 7,
        classId: 2,
        class: {
          id: 2,
          name: 'Morning Flow',
          description: null,
          level: 'beginner',
          durationMinutes: 45,
          status: 'open',
          instructorId: 10,
          createdBy: null,
          updatedBy: null,
          createdAt: new Date('2026-04-19T09:00:00.000Z'),
          updatedAt: new Date('2026-04-19T09:00:00.000Z'),
          instructor: {
            id: 10,
            name: 'Coach',
            specialty: 'HIIT',
            createdBy: null,
            updatedBy: null,
          },
        },
      },
    ]);

    const result = await listReservations(7);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      class: {
        id: 2,
        instructor: {
          id: 10,
        },
      },
    });
  });
});
