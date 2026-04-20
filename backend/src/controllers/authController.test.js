import { beforeEach, describe, expect, it, vi } from 'vitest';

const authServiceMock = {
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
};

vi.mock('../services/authService.js', () => authServiceMock);

const { login, me, register } = await import('./authController.js');

function createRes() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

function flushPromises() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register returns 201 and payload', async () => {
    authServiceMock.registerUser.mockResolvedValueOnce({ token: 'ok' });
    const req = { body: { email: 'jane@fitico.io', password: '123456' } };
    const res = createRes();
    const next = vi.fn();

    register(req, res, next);
    await flushPromises();

    expect(authServiceMock.registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: 'ok' });
    expect(next).not.toHaveBeenCalled();
  });

  it('login returns payload', async () => {
    authServiceMock.loginUser.mockResolvedValueOnce({ token: 'ok2' });
    const req = { body: { email: 'jane@fitico.io', password: '123456' } };
    const res = createRes();

    login(req, res, vi.fn());
    await flushPromises();

    expect(authServiceMock.loginUser).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith({ token: 'ok2' });
  });

  it('me returns authenticated user', async () => {
    authServiceMock.getCurrentUser.mockResolvedValueOnce({ id: 1, email: 'user@fitico.io' });
    const req = { user: { id: 1 } };
    const res = createRes();

    me(req, res, vi.fn());
    await flushPromises();

    expect(authServiceMock.getCurrentUser).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 1, email: 'user@fitico.io' } });
  });

  it('forwards async errors to next', async () => {
    const error = new Error('bad login');
    authServiceMock.loginUser.mockRejectedValueOnce(error);
    const next = vi.fn();

    login({ body: {} }, createRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(error);
  });
});
