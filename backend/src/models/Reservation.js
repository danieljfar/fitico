import { DataTypes } from 'sequelize';

export function defineBookingModel(sequelize) {
  return sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      externalBookingId: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'bookings',
    }
  );
}