import { beforeEach, describe, expect, it, vi } from 'vitest';

const bcryptMock = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const jwtMock = {
  sign: vi.fn(),
};

const userRepositoryMock = {
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
};

vi.mock('bcrypt', () => ({
  default: bcryptMock,
}));

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}));

vi.mock('../repositories/userRepository.js', () => userRepositoryMock);

const { ApiError } = await import('../utils/apiError.js');
const { getCurrentUser, loginUser, registerUser } = await import('./authService.js');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('throws when required fields are missing', async () => {
      await expect(registerUser({ name: 'A', email: 'a@a.com' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'name, email and password are required',
      });
    });

    it('throws when email already exists', async () => {
      userRepositoryMock.findUserByEmail.mockResolvedValueOnce({ id: 1 });

      await expect(registerUser({ name: 'A', email: 'A@A.COM', password: '123456' })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email already exists',
      });

      expect(userRepositoryMock.findUserByEmail).toHaveBeenCalledWith('a@a.com');
    });

    it('creates user and returns signed token', async () => {
      userRepositoryMock.findUserByEmail.mockResolvedValueOnce(null);
      bcryptMock.hash.mockResolvedValueOnce('hashed');
      userRepositoryMock.createUser.mockResolvedValueOnce({
        id: 2,
        name: 'Jane',
        email: 'jane@fitico.io',
        role: 'member',
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
      });
      jwtMock.sign.mockReturnValueOnce('jwt-token');

      const result = await registerUser({
        name: 'Jane',
        email: 'JANE@FITICO.IO',
        password: 'very-secret',
      });

      expect(bcryptMock.hash).toHaveBeenCalledWith('very-secret', 12);
      expect(userRepositoryMock.createUser).toHaveBeenCalledWith({
        name: 'Jane',
        email: 'jane@fitico.io',
        passwordHash: 'hashed',
      });
      expect(result).toMatchObject({
        token: 'jwt-token',
        user: {
          id: 2,
          email: 'jane@fitico.io',
        },
      });
    });
  });

  describe('loginUser', () => {
    it('throws when payload is invalid', async () => {
      await expect(loginUser({ email: 'a@b.com' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'email and password are required',
      });
    });

    it('throws when user does not exist', async () => {
      userRepositoryMock.findUserByEmail.mockResolvedValueOnce(null);

      await expect(loginUser({ email: 'none@fitico.io', password: '123456' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('throws when password does not match', async () => {
      userRepositoryMock.findUserByEmail.mockResolvedValueOnce({
        id: 8,
        email: 'john@fitico.io',
        passwordHash: 'hashed',
      });
      bcryptMock.compare.mockResolvedValueOnce(false);

      await expect(loginUser({ email: 'john@fitico.io', password: 'bad' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('returns user and token when credentials are valid', async () => {
      userRepositoryMock.findUserByEmail.mockResolvedValueOnce({
        id: 8,
        name: 'John',
        email: 'john@fitico.io',
        role: 'admin',
        passwordHash: 'hashed',
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
      });
      bcryptMock.compare.mockResolvedValueOnce(true);
      jwtMock.sign.mockReturnValueOnce('token-ok');

      const result = await loginUser({ email: 'JOHN@FITICO.IO', password: 'good' });

      expect(userRepositoryMock.findUserByEmail).toHaveBeenCalledWith('john@fitico.io');
      expect(result).toMatchObject({
        token: 'token-ok',
        user: {
          id: 8,
          role: 'admin',
        },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('throws when user does not exist', async () => {
      userRepositoryMock.findUserById.mockResolvedValueOnce(null);

      await expect(getCurrentUser(123)).rejects.toBeInstanceOf(ApiError);
      await expect(getCurrentUser(123)).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });

    it('returns sanitized current user', async () => {
      userRepositoryMock.findUserById.mockResolvedValueOnce({
        id: 123,
        name: 'Luke',
        email: 'luke@fitico.io',
        role: 'member',
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
        passwordHash: 'should-not-leak',
      });

      const result = await getCurrentUser(123);

      expect(result).toEqual({
        id: 123,
        name: 'Luke',
        email: 'luke@fitico.io',
        role: 'member',
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
      });
    });
  });
});
