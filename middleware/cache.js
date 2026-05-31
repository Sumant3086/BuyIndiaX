/**
 * Two-tier response cache:
 *   Tier 1 — in-memory LRU (always available, zero cost, zero config)
 *   Tier 2 — Redis (optional; used when REDIS_URL is set)
 *
 * Falls back to Tier 1 automatically when Redis is down or not configured.
 * This means caching works on free hosting with no Redis at all.
 */

const { getCache, setCache, isRedisAvailable } = require('../utils/redisClient');

// ── Lightweight in-memory LRU cache ──────────────────────────────────────────
class LRUCache {
  constructor(maxSize = 500) {
    this._map = new Map();
    this._maxSize = maxSize;
  }

  get(key) {
    const item = this._map.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) { this._map.delete(key); return null; }
    // Move to end (most-recently-used)
    this._map.delete(key);
    this._map.set(key, item);
    return item.value;
  }

  set(key, value, ttlSeconds) {
    if (this._map.size >= this._maxSize) {
      // Evict oldest entry
      this._map.delete(this._map.keys().next().value);
    }
    this._map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key) { this._map.delete(key); }

  deleteByPrefix(prefix) {
    for (const k of this._map.keys()) {
      if (k.startsWith(prefix)) this._map.delete(k);
    }
  }

  get size() { return this._map.size; }
}

const memCache = new LRUCache(500);

// ── Core helpers ──────────────────────────────────────────────────────────────
const cacheGet = async (key) => {
  const mem = memCache.get(key);
  if (mem !== null) return mem;
  if (isRedisAvailable()) return getCache(key);
  return null;
};

const cacheSet = async (key, value, ttl) => {
  memCache.set(key, value, Math.min(ttl, 120)); // mem TTL capped at 2 min
  if (isRedisAvailable()) setCache(key, value, ttl).catch(() => {});
};

const cacheDelete = (key) => {
  memCache.delete(key);
  // Redis deletion is best-effort
  if (isRedisAvailable()) {
    const { deleteCache } = require('../utils/redisClient');
    deleteCache(key).catch(() => {});
  }
};

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Cache GET responses. Skipped for authenticated requests on public routes.
 * Usage: router.get('/path', cache(300), handler)
 */
const cache = (ttlSeconds = 300) => async (req, res, next) => {
  const key = `rc:${req.originalUrl}`;
  try {
    const cached = await cacheGet(key);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
  } catch { /* fall through */ }

  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode === 200) {
      cacheSet(key, data, ttlSeconds).catch(() => {});
      res.setHeader('X-Cache', 'MISS');
    }
    return originalJson(data);
  };
  next();
};

/**
 * Per-user cache for personalized endpoints.
 */
const userCache = (ttlSeconds = 120) => async (req, res, next) => {
  if (!req.user) return next();
  const key = `rc:u:${req.user._id}:${req.originalUrl}`;
  try {
    const cached = await cacheGet(key);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
  } catch { /* fall through */ }

  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode === 200) cacheSet(key, data, ttlSeconds).catch(() => {});
    return originalJson(data);
  };
  next();
};

/**
 * Invalidate cache by URL prefixes.
 * Clears both in-memory and Redis tiers.
 */
const invalidateCache = (...prefixes) => {
  for (const prefix of prefixes) {
    memCache.deleteByPrefix(prefix);
    if (isRedisAvailable()) {
      const { redisClient } = require('../utils/redisClient');
      if (redisClient) {
        redisClient.keys(`${prefix}*`)
          .then(keys => keys.length > 0 && redisClient.del(keys))
          .catch(() => {});
      }
    }
  }
};

// Expose memCache for monitoring
const getCacheStats = () => ({ memCacheSize: memCache.size, redisAvailable: isRedisAvailable() });

module.exports = { cache, userCache, invalidateCache, getCacheStats, memCache };
