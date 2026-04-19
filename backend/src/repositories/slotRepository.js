import { Slot } from '../database/index.js';

export function findAllSlots() {
  return Slot.findAll({ order: [['startsAt', 'ASC']] });
}

export function findSlotById(slotId, transaction) {
  return Slot.findByPk(slotId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
}

export function createSlots(slots) {
  return Slot.bulkCreate(slots);
}

export function countSlots() {
  return Slot.count();
}