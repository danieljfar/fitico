import { asyncHandler } from '../utils/asyncHandler.js';
import { getCurrentUser, loginUser, registerUser } from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  res.json({ user });
});