import sequelize from '../config/db.js';
import { defineBookingModel } from '../models/Reservation.js';
import { defineSlotModel } from '../models/Slot.js';
import { defineUserModel } from '../models/User.js';

const User = defineUserModel(sequelize);
const Slot = defineSlotModel(sequelize);
const Booking = defineBookingModel(sequelize);

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Slot.hasMany(Booking, { foreignKey: 'slotId', as: 'bookings' });
Booking.belongsTo(Slot, { foreignKey: 'slotId', as: 'slot' });

export { sequelize, User, Slot, Booking };