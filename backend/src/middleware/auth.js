import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';

export function requireAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing bearer token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}