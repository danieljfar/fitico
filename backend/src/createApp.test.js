import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './createApp.js';

describe('createApp', () => {
  it('returns health payload', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'UP',
      service: 'Fitico API',
    });
  });

  it('returns root metadata payload', async () => {
    const app = createApp();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Fitico API');
    expect(response.body.endpoints).toContain('/api/auth');
  });

  it('returns openapi spec at docs.json', async () => {
    const app = createApp();

    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('Fitico API');
  });

  it('returns structured 404 for unknown endpoint', async () => {
    const app = createApp();

    const response = await request(app).get('/unknown/path');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        message: 'Route GET /unknown/path not found',
        statusCode: 404,
      },
    });
  });
});
