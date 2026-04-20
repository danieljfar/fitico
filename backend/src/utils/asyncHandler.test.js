import { describe, expect, it, vi } from 'vitest';
import { asyncHandler } from './asyncHandler.js';

function flushPromises() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('asyncHandler', () => {
  it('calls wrapped handler successfully', async () => {
    const handler = vi.fn().mockResolvedValueOnce(undefined);
    const wrapped = asyncHandler(handler);
    const next = vi.fn();

    wrapped({ path: '/ok' }, {}, next);
    await flushPromises();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards rejected errors to next', async () => {
    const error = new Error('explode');
    const wrapped = asyncHandler(async () => {
      throw error;
    });
    const next = vi.fn();

    wrapped({}, {}, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(error);
  });
});
