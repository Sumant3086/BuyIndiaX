const redis = require('redis');

/**
 * Redis Client for Caching and Collaborative Filtering
 */

let redisClient = null;
let isRedisAvailable = false;

const initRedis = async () => {
  try {
    // Only initialize if Redis URL is provided
    if (!process.env.REDIS_URL) {
      console.log('Redis not configured. Running without cache.');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis initialization failed:', error.message);
    isRedisAvailable = false;
    return null;
  }
};

/**
 * Get cached data
 */
const getCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

/**
 * Set cached data with expiration
 */
const setCache = async (key, value, expirationInSeconds = 3600) => {
  if (!isRedisAvailable || !redisClient) return false;
  
  try {
    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
};

/**
 * Delete cached data
 */
const deleteCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
};

/**
 * Increment counter (for CTR tracking)
 */
const incrementCounter = async (key) => {
  if (!isRedisAvailable || !redisClient) return 0;
  
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.error('Redis INCR error:', error);
    return 0;
  }
};

/**
 * Add to sorted set (for collaborative filtering)
 */
const addToSortedSet = async (key, score, member) => {
  if (!isRedisAvailable || !redisClient) return false;
  
  try {
    await redisClient.zAdd(key, { score, value: member });
    return true;
  } catch (error) {
    console.error('Redis ZADD error:', error);
    return false;
  }
};

/**
 * Get top items from sorted set
 */
const getTopFromSortedSet = async (key, count = 10) => {
  if (!isRedisAvailable || !redisClient) return [];
  
  try {
    return await redisClient.zRange(key, 0, count - 1, { REV: true });
  } catch (error) {
    console.error('Redis ZRANGE error:', error);
    return [];
  }
};

/**
 * Store user-product interaction for collaborative filtering
 */
const storeUserInteraction = async (userId, productId, score) => {
  if (!isRedisAvailable || !redisClient) return false;
  
  try {
    // Store in user's interaction set
    await redisClient.zAdd(`user:${userId}:interactions`, { 
      score, 
      value: productId 
    });
    
    // Store in product's user set
    await redisClient.zAdd(`product:${productId}:users`, { 
      score, 
      value: userId 
    });
    
    return true;
  } catch (error) {
    console.error('Redis interaction storage error:', error);
    return false;
  }
};

/**
 * Get similar users based on product interactions
 */
const getSimilarUsers = async (userId, limit = 20) => {
  if (!isRedisAvailable || !redisClient) return [];
  
  try {
    // Get user's interacted products
    const userProducts = await redisClient.zRange(`user:${userId}:interactions`, 0, -1);
    
    if (userProducts.length === 0) return [];
    
    // Find other users who interacted with same products
    const similarUsers = new Map();
    
    for (const productId of userProducts) {
      const users = await redisClient.zRange(`product:${productId}:users`, 0, 49, { REV: true });
      
      for (const otherUserId of users) {
        if (otherUserId !== userId) {
          similarUsers.set(otherUserId, (similarUsers.get(otherUserId) || 0) + 1);
        }
      }
    }
    
    // Sort by similarity score
    return Array.from(similarUsers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId);
  } catch (error) {
    console.error('Redis similar users error:', error);
    return [];
  }
};

/**
 * Get collaborative filtering recommendations
 */
const getCollaborativeRecommendations = async (userId, limit = 10) => {
  if (!isRedisAvailable || !redisClient) return [];
  
  try {
    // Get similar users
    const similarUsers = await getSimilarUsers(userId, 20);
    
    if (similarUsers.length === 0) return [];
    
    // Get user's already interacted products
    const userProducts = await redisClient.zRange(`user:${userId}:interactions`, 0, -1);
    const userProductSet = new Set(userProducts);
    
    // Aggregate products from similar users
    const recommendedProducts = new Map();
    
    for (const similarUserId of similarUsers) {
      const products = await redisClient.zRange(`user:${similarUserId}:interactions`, 0, 19, { 
        REV: true,
        WITHSCORES: true 
      });
      
      for (let i = 0; i < products.length; i += 2) {
        const productId = products[i];
        const score = parseFloat(products[i + 1]);
        
        // Skip if user already interacted with this product
        if (!userProductSet.has(productId)) {
          recommendedProducts.set(
            productId, 
            (recommendedProducts.get(productId) || 0) + score
          );
        }
      }
    }
    
    // Sort and return top recommendations
    return Array.from(recommendedProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);
  } catch (error) {
    console.error('Redis collaborative recommendations error:', error);
    return [];
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  incrementCounter,
  addToSortedSet,
  getTopFromSortedSet,
  storeUserInteraction,
  getSimilarUsers,
  getCollaborativeRecommendations,
  isRedisAvailable: () => isRedisAvailable,
  get redisClient() { return redisClient; }
};
