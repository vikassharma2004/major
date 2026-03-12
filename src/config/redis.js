import Redis from 'ioredis';
import logger from './logger.js';

let redisClient = null;

export const connectRedis = async () => {
  try {
    // Use Redis URL if provided, otherwise use individual config
    const redisConfig = process.env.REDIS_URL ? {
      url: process.env.REDIS_URL
    } : {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0
    };

    redisClient = new Redis({
      ...redisConfig,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis ping successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't throw error - app should work without Redis
    return null;
  }
};

export const getRedisClient = () => redisClient;

// Token blacklist functions
export const blacklistToken = async (token, expiresIn) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.setex(`blacklist:${token}`, expiresIn, 'true');
    return true;
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    return false;
  }
};

export const isTokenBlacklisted = async (token) => {
  if (!redisClient) return false;
  
  try {
    const result = await redisClient.get(`blacklist:${token}`);
    return result === 'true';
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    return false;
  }
};

// Session management
export const setSession = async (key, data, ttl = 3600) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Failed to set session:', error);
    return false;
  }
};

export const getSession = async (key) => {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to get session:', error);
    return null;
  }
};

export const deleteSession = async (key) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Failed to delete session:', error);
    return false;
  }
};

// Rate limiting helpers
export const incrementRateLimit = async (key, windowMs, maxRequests) => {
  if (!redisClient) return { allowed: true, remaining: maxRequests };
  
  try {
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }
    
    const remaining = Math.max(0, maxRequests - current);
    const allowed = current <= maxRequests;
    
    return { allowed, remaining, current };
  } catch (error) {
    logger.error('Failed to check rate limit:', error);
    return { allowed: true, remaining: maxRequests };
  }
};

export const getRemainingTime = async (key) => {
  if (!redisClient) return 0;
  
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    logger.error('Failed to get remaining time:', error);
    return 0;
  }
};