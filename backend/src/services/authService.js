import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository.js';

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function signToken(user) {
  return jwt.sign(buildTokenPayload(user), process.env.JWT_SECRET || 'change-me-in-production', {
    expiresIn: '8h',
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    name,
    email: normalizedEmail,
    passwordHash,
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const user = await findUserByEmail(email.toLowerCase());

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
}