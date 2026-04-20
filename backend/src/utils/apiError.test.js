import { describe, expect, it } from 'vitest';
import { ApiError } from './apiError.js';

describe('ApiError', () => {
  it('builds error instance with name and statusCode', () => {
    const error = new ApiError(422, 'Invalid payload');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Invalid payload');
  });
});
