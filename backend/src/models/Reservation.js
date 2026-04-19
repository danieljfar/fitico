import { DataTypes } from 'sequelize';

export function defineReservationModel(sequelize) {
  return sequelize.define(
    'Reservation',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'reservations',
    }
  );
}