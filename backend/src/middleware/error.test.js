import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../utils/apiError.js';
import { errorMiddleware } from './error.js';

function createRes() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('errorMiddleware', () => {
  it('formats ApiError with its statusCode', () => {
    const res = createRes();

    errorMiddleware(new ApiError(409, 'Conflict happened'), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Conflict happened',
        statusCode: 409,
      },
    });
  });

  it('formats unknown error as 500', () => {
    const res = createRes();

    errorMiddleware(new Error('Unexpected crash'), {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Unexpected crash',
        statusCode: 500,
      },
    });
  });
});
