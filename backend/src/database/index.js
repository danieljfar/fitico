import sequelize from '../config/db.js';
import { defineReservationModel } from '../models/Reservation.js';
import { defineSlotModel } from '../models/Slot.js';
import { defineUserModel } from '../models/User.js';

const User = defineUserModel(sequelize);
const Slot = defineSlotModel(sequelize);
const Reservation = defineReservationModel(sequelize);

User.hasMany(Reservation, { foreignKey: 'userId', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Slot.hasMany(Reservation, { foreignKey: 'slotId', as: 'reservations' });
Reservation.belongsTo(Slot, { foreignKey: 'slotId', as: 'slot' });

export { sequelize, User, Slot, Reservation };