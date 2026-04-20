import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from './docs/openapi.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim()) : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Fitico API' });
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'Fitico API',
      version: '1.0.0',
      endpoints: ['/health', '/docs', '/docs.json', '/api/auth', '/api/classes', '/api/bookings'],
    });
  });

  app.get('/docs.json', (req, res) => {
    res.json(openApiSpec);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: `Route ${req.method} ${req.originalUrl} not found`,
        statusCode: 404,
      },
    });
  });

  app.use(errorMiddleware);

  return app;
}