import dotenv from 'dotenv';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { setSocketServer } from './config/socket.js';
import { createApp } from './createApp.js';
import { sequelize } from './database/index.js';
import { runMigrations } from './database/migrate.js';
import { ensureSeedData } from './services/bootstrapService.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim()) : true,
    credentials: true,
  },
});

setSocketServer(io);

io.on('connection', (socket) => {
  socket.emit('server:ready', {
    message: 'Connected to Fitness Flow realtime channel',
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await runMigrations();
    await ensureSeedData();

    const port = Number(process.env.PORT || 4000);

    server.listen(port, () => {
      console.log(`Fitness Flow API ready at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exitCode = 1;
  }
}

startServer();