import { DataTypes } from 'sequelize';

export function defineUserModel(sequelize) {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('member', 'admin'),
        allowNull: false,
        defaultValue: 'member',
      },
    },
    {
      tableName: 'users',
    }
  );
}