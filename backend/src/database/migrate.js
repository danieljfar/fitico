import { sequelize } from './index.js';
import { DataTypes } from 'sequelize';

async function ensureClassBookedCountColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'classes';

  const tableDefinition = await queryInterface.describeTable(tableName);
  const hasLegacyBookedCount = Object.prototype.hasOwnProperty.call(tableDefinition, 'bookedCount');
  const hasBookedCount = Object.prototype.hasOwnProperty.call(tableDefinition, 'booked_count');

  if (hasLegacyBookedCount && !hasBookedCount) {
    await queryInterface.renameColumn(tableName, 'bookedCount', 'booked_count');
    return;
  }

  if (hasLegacyBookedCount && hasBookedCount) {
    await queryInterface.removeColumn(tableName, 'bookedCount');
    return;
  }

  if (!hasBookedCount) {
    await queryInterface.addColumn(tableName, 'booked_count', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  }
}

export async function runMigrations() {
  const shouldForce = process.env.DB_SYNC_FORCE === 'true';
  const shouldAlter = process.env.DB_SYNC_ALTER === 'true';

  if (shouldForce) {
    await sequelize.sync({ force: true });
    return;
  }

  if (shouldAlter) {
    await sequelize.sync({ alter: true });
    await ensureClassBookedCountColumn();
    return;
  }

  await sequelize.sync();
  await ensureClassBookedCountColumn();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Database migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database migration failed:', error);
      process.exit(1);
    });
}
