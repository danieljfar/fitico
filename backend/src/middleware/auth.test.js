import { beforeEach, describe, expect, it, vi } from 'vitest';

const jwtMock = {
  verify: vi.fn(),
};

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}));

const { requireAdmin, requireAuth } = await import('./auth.js');

function createReq(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  };
}

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requireAuth rejects when bearer token is missing', () => {
    const next = vi.fn();

    requireAuth(createReq(), {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Missing bearer token',
      })
    );
  });

  it('requireAuth attaches user from verified token', () => {
    jwtMock.verify.mockReturnValueOnce({
      sub: '7',
      email: 'u@fitico.io',
      name: 'User',
      role: 'member',
    });

    const req = createReq({ headers: { authorization: 'Bearer token-123' } });
    const next = vi.fn();

    requireAuth(req, {}, next);

    expect(req.user).toEqual({
      id: 7,
      email: 'u@fitico.io',
      name: 'User',
      role: 'member',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('requireAuth rejects invalid token', () => {
    jwtMock.verify.mockImplementationOnce(() => {
      throw new Error('bad');
    });

    const req = createReq({ headers: { authorization: 'Bearer bad-token' } });
    const next = vi.fn();

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid or expired token',
      })
    );
  });

  it('requireAdmin rejects missing req.user', () => {
    const next = vi.fn();

    requireAdmin({}, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Authentication required',
      })
    );
  });

  it('requireAdmin rejects non-admin user', () => {
    const next = vi.fn();

    requireAdmin({ user: { role: 'member' } }, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Admin access required',
      })
    );
  });

  it('requireAdmin passes for admin user', () => {
    const next = vi.fn();

    requireAdmin({ user: { role: 'admin' } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
