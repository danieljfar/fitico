import { DataTypes } from 'sequelize';

export function defineSlotModel(sequelize) {
  return sequelize.define(
    'Slot',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      bookedCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
    },
    {
      tableName: 'slots',
    }
  );
}