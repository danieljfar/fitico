import moment from 'moment';
import { ApiError } from '../utils/apiError.js';
import { findAllSlots } from '../repositories/slotRepository.js';

function serializeSlot(slot) {
  const availableSeats = Math.max(slot.capacity - slot.bookedCount, 0);

  return {
    id: slot.id,
    title: slot.title,
    startsAt: slot.startsAt,
    startsAtLabel: moment(slot.startsAt).format('YYYY-MM-DD HH:mm'),
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    availableSeats,
    status: slot.status,
    isFull: availableSeats === 0,
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
  };
}

export async function listSlots() {
  const slots = await findAllSlots();
  return slots.map(serializeSlot);
}

export function normalizeSlot(slot) {
  if (!slot) {
    throw new ApiError(404, 'Slot not found');
  }

  return serializeSlot(slot);
}