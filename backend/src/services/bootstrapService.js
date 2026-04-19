import moment from 'moment';
import { countSlots, createSlots } from '../repositories/slotRepository.js';

export async function ensureSeedData() {
  const existingSlotCount = await countSlots();

  if (existingSlotCount > 0) {
    return;
  }

  const startsAtBase = moment().add(1, 'day').startOf('day');
  const demoSlots = [
    { title: 'Strength Lab', startsAt: startsAtBase.clone().hour(8).toDate(), capacity: 12 },
    { title: 'Mobility Reset', startsAt: startsAtBase.clone().hour(10).toDate(), capacity: 8 },
    { title: 'Lunch HIIT', startsAt: startsAtBase.clone().hour(13).toDate(), capacity: 16 },
    { title: 'Evening Recovery', startsAt: startsAtBase.clone().hour(18).toDate(), capacity: 10 },
    { title: 'Weekend Deep Focus', startsAt: startsAtBase.clone().add(1, 'day').hour(9).toDate(), capacity: 20 },
  ];

  await createSlots(demoSlots);
}