import { sequelize } from './index.js';

export async function runMigrations() {
  const shouldForce = process.env.DB_SYNC_FORCE === 'true';
  const shouldAlter = process.env.DB_SYNC_ALTER === 'true';

  if (shouldForce) {
    await sequelize.sync({ force: true });
    return;
  }

  if (shouldAlter) {
    await sequelize.sync({ alter: true });
    return;
  }

  await sequelize.sync();
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
