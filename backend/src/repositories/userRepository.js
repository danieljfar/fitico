import { User } from '../database/index.js';

export function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

export function findUserById(userId) {
  return User.findByPk(userId);
}

export function createUser(userData) {
  return User.create(userData);
}