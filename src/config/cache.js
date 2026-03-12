import NodeCache from "node-cache";
import crypto from "crypto";
import logger from "./logger.js";

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  useClones: false
});

export const initCache = () => {
  logger.info("NodeCache initialized");
  return cache;
};

export const buildCacheKey = (prefix, parts = []) => {
  const raw = [prefix, ...parts].join("|");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return `${prefix}:${hash}`;
};

export const getCache = (key) => cache.get(key);
export const setCache = (key, value, ttl) => cache.set(key, value, ttl);
export const delCache = (key) => cache.del(key);
export const flushCache = () => cache.flushAll();

export const blacklistToken = async (token, expiresIn) => {
  const key = buildCacheKey("blacklist", [token]);
  return cache.set(key, true, expiresIn);
};

export const isTokenBlacklisted = async (token) => {
  const key = buildCacheKey("blacklist", [token]);
  return cache.get(key) === true;
};

export const setSession = async (key, data, ttl = 3600) => {
  const cacheKey = buildCacheKey("session", [key]);
  return cache.set(cacheKey, data, ttl);
};

export const getSession = async (key) => {
  const cacheKey = buildCacheKey("session", [key]);
  return cache.get(cacheKey) || null;
};

export const deleteSession = async (key) => {
  const cacheKey = buildCacheKey("session", [key]);
  return cache.del(cacheKey);
};

export const incrementRateLimit = async (key, windowMs, maxRequests) => {
  const cacheKey = buildCacheKey("ratelimit", [key]);
  const entry = cache.get(cacheKey) || { count: 0, resetAt: Date.now() + windowMs };

  if (Date.now() > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = Date.now() + windowMs;
  }

  entry.count += 1;
  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  cache.set(cacheKey, entry, Math.ceil(windowMs / 1000));

  return { allowed, remaining, current: entry.count };
};

export const getRemainingTime = async (key) => {
  const cacheKey = buildCacheKey("ratelimit", [key]);
  const entry = cache.get(cacheKey);
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
};
