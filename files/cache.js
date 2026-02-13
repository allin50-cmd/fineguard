const Redis = require('ioredis');
const pino = require('pino');

const logger = pino({ name: 'cache' });

// ============================================================
// REDIS CONNECTION WITH CLUSTER SUPPORT
// ============================================================

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  
  // Connection options
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn({ times, delay }, 'Redis retry attempt');
    return delay;
  },
  
  // Performance tuning
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  
  // TLS for Azure Redis
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  
  // Timeouts
  connectTimeout: 10000,
  disconnectTimeout: 2000,
  commandTimeout: 5000
};

// Parse Redis URL if provided
if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisConfig.host = url.hostname;
  redisConfig.port = parseInt(url.port);
  if (url.password) redisConfig.password = url.password;
  if (url.protocol === 'rediss:') redisConfig.tls = {};
}

const redis = new Redis(redisConfig);

// Event handlers
redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// ============================================================
// CACHE PATTERNS FOR 5.8M COMPANIES
// ============================================================

class CacheService {
  constructor(client) {
    this.client = client;
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug({ key }, 'Cache hit');
      } else {
        logger.debug({ key }, 'Cache miss');
      }
      return value;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.setex(key, ttl, value);
      logger.debug({ key, ttl }, 'Cache set');
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      await this.client.del(key);
      logger.debug({ key }, 'Cache deleted');
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Cache company data
   */
  async cacheCompany(companyNumber, data, ttl = 86400) {
    const key = `company:${companyNumber}`;
    return this.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Get cached company
   */
  async getCompany(companyNumber) {
    const key = `company:${companyNumber}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cache search results (with pagination)
   */
  async cacheSearchResults(query, page, data, ttl = 300) {
    const key = `search:${Buffer.from(query).toString('base64')}:${page}`;
    return this.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Get cached search results
   */
  async getSearchResults(query, page) {
    const key = `search:${Buffer.from(query).toString('base64')}:${page}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cache dashboard statistics
   */
  async cacheStats(data, ttl = 600) {
    const key = 'stats:dashboard';
    return this.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Get cached statistics
   */
  async getStats() {
    const key = 'stats:dashboard';
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate company-related caches
   */
  async invalidateCompany(companyNumber) {
    const pattern = `*${companyNumber}*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
      logger.info({ companyNumber, keysDeleted: keys.length }, 'Company cache invalidated');
    }
  }

  /**
   * Rate limiting using sliding window
   */
  async checkRateLimit(identifier, limit = 100, window = 60) {
    const key = `ratelimit:${identifier}`;
    
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, window);
      }
      
      return {
        allowed: current <= limit,
        current,
        limit,
        remaining: Math.max(0, limit - current)
      };
    } catch (error) {
      logger.error({ error, identifier }, 'Rate limit check error');
      return { allowed: true, current: 0, limit, remaining: limit };
    }
  }

  /**
   * Distributed lock for concurrent operations
   */
  async acquireLock(resource, ttl = 30) {
    const key = `lock:${resource}`;
    const token = Math.random().toString(36).substring(7);
    
    try {
      const result = await this.client.set(key, token, 'EX', ttl, 'NX');
      if (result === 'OK') {
        logger.debug({ resource, token }, 'Lock acquired');
        return token;
      }
      return null;
    } catch (error) {
      logger.error({ error, resource }, 'Lock acquisition error');
      return null;
    }
  }

  /**
   * Release distributed lock
   */
  async releaseLock(resource, token) {
    const key = `lock:${resource}`;
    
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.client.eval(script, 1, key, token);
      if (result === 1) {
        logger.debug({ resource, token }, 'Lock released');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error, resource }, 'Lock release error');
      return false;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget(keys) {
    try {
      const values = await this.client.mget(...keys);
      return keys.reduce((acc, key, index) => {
        if (values[index]) {
          acc[key] = values[index];
        }
        return acc;
      }, {});
    } catch (error) {
      logger.error({ error, keys: keys.length }, 'Batch get error');
      return {};
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(data, ttl = this.defaultTTL) {
    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(data).forEach(([key, value]) => {
        pipeline.setex(key, ttl, value);
      });
      
      await pipeline.exec();
      logger.debug({ keys: Object.keys(data).length }, 'Batch set completed');
      return true;
    } catch (error) {
      logger.error({ error }, 'Batch set error');
      return false;
    }
  }

  /**
   * Cache with automatic fallback to database
   */
  async cacheOrFetch(key, fetchFn, ttl = this.defaultTTL) {
    try {
      // Try cache first
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Fetch from source
      const data = await fetchFn();
      
      // Cache the result
      if (data) {
        await this.set(key, JSON.stringify(data), ttl);
      }
      
      return data;
    } catch (error) {
      logger.error({ error, key }, 'Cache-or-fetch error');
      // Return uncached data on error
      return fetchFn();
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const info = await this.client.info('stats');
      const dbInfo = await this.client.info('keyspace');
      
      return {
        connected: this.client.status === 'ready',
        keyspace: this.parseKeyspace(dbInfo),
        stats: this.parseStats(info)
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return null;
    }
  }

  /**
   * Parse Redis INFO stats
   */
  parseStats(info) {
    const stats = {};
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });
    return stats;
  }

  /**
   * Parse Redis keyspace info
   */
  parseKeyspace(info) {
    const match = info.match(/keys=(\d+),expires=(\d+)/);
    if (match) {
      return {
        keys: parseInt(match[1]),
        expires: parseInt(match[2])
      };
    }
    return { keys: 0, expires: 0 };
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll() {
    try {
      await this.client.flushdb();
      logger.warn('Cache flushed');
      return true;
    } catch (error) {
      logger.error({ error }, 'Cache flush error');
      return false;
    }
  }

  /**
   * Health check
   */
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error({ error }, 'Redis ping failed');
      return false;
    }
  }

  /**
   * Close connection
   */
  async quit() {
    logger.info('Closing Redis connection...');
    await this.client.quit();
    logger.info('Redis connection closed');
  }
}

// Export singleton instance
const cacheService = new CacheService(redis);

module.exports = cacheService;
module.exports.redis = redis;
module.exports.CacheService = CacheService;
