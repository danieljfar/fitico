import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

let client;

function getClient() {
  if (!client) {
    client = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    client.on('error', (error) => {
      console.warn(`[redis] ${error.message}`);
    });
  }

  return client;
}

async function ensureConnected(redisClient) {
  if (redisClient.status === 'wait') {
    await redisClient.connect();
  }
}

export async function getJsonCache(cacheKey) {
  try {
    const redisClient = getClient();
    await ensureConnected(redisClient);

    const raw = await redisClient.get(cacheKey);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[redis:get] ${error.message}`);
    return null;
  }
}

export async function setJsonCache(cacheKey, value, ttlSeconds = null) {
  try {
    const redisClient = getClient();
    await ensureConnected(redisClient);

    const serialized = JSON.stringify(value);

    if (Number.isInteger(ttlSeconds) && ttlSeconds > 0) {
      await redisClient.set(cacheKey, serialized, 'EX', ttlSeconds);
    } else {
      await redisClient.set(cacheKey, serialized);
    }

    return true;
  } catch (error) {
    console.warn(`[redis:set] ${error.message}`);
    return false;
  }
}

export async function deleteCacheKey(cacheKey) {
  try {
    const redisClient = getClient();
    await ensureConnected(redisClient);

    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.warn(`[redis:del] ${error.message}`);
    return false;
  }
}
