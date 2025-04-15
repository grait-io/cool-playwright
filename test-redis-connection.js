const Redis = require('ioredis');

// Get Redis URL from environment variable or use default
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';

console.log(`Testing connection to Redis at: ${redisUrl.replace(/\/\/:[^@]+@/, '//:*****@')}`);

// Create Redis client
const redis = new Redis(redisUrl);

// Handle connection events
redis.on('connect', () => {
  console.log('✅ Successfully connected to Redis');
  process.exit(0);
});

redis.on('error', (err) => {
  console.error(`❌ Redis connection error: ${err.message}`);
  
  if (err.message.includes('ECONNREFUSED')) {
    console.error('Make sure the REDIS_URL environment variable is correctly set');
    console.error('Expected format: redis://:password@hostname:port/db');
    console.error('\nTry running with a specific Redis URL:');
    console.error('REDIS_URL="redis://:password@hostname:port/db" node test-redis-connection.js');
  }
  
  process.exit(1);
});

// Set a timeout to prevent hanging
setTimeout(() => {
  console.error('❌ Connection timeout after 5 seconds');
  process.exit(1);
}, 5000);