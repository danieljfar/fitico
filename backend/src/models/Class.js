import { DataTypes } from 'sequelize';

export function defineClassModel(sequelize) {
  return sequelize.define(
    'Class',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      instructorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      bikeLabel: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner',
      },
      durationMinutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 45,
      },
      status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      capacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      bookedCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
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
      tableName: 'classes',
      timestamps: true,
      underscored: true,
    }
  );
}
