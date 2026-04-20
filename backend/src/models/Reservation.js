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
      status: {
        type: DataTypes.ENUM('active', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'created_by',
      },
      updatedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'updated_by',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'updated_at',
      },
    },
    {
      tableName: 'bookings',
      timestamps: false,
      underscored: true,
      hooks: {
        beforeCreate(instance) {
          const now = new Date();
          instance.createdAt = now;
          instance.updatedAt = now;
        },
        beforeUpdate(instance) {
          instance.updatedAt = new Date();
        },
      },
    }
  );
}