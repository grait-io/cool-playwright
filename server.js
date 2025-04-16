const express = require('express');
const { chromium } = require('playwright');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

const app = express();
const port = process.env.PORT || 3000;

// Use REDIS_URL from environment or fallback to local Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
console.log(`Connecting to Redis at: ${redisUrl.replace(/\/\/:[^@]+@/, '//:*****@')}`); // Log URL with password masked

// Create Redis client with better error handling
const redis = new Redis(redisUrl);

// Handle Redis connection errors
redis.on('error', (err) => {
  console.error(`Redis connection error: ${err.message}`);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('Make sure the REDIS_URL environment variable is correctly set in Coolify');
    console.error('Expected format: redis://:password@hostname:port/db');
  }
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis');
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redis.ping();
    res.status(200).json({
      status: 'healthy',
      redis: 'connected',
      redis_url: redisUrl.replace(/\/\/:[^@]+@/, '//:*****@'), // Mask password
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      redis: 'disconnected',
      redis_url: redisUrl.replace(/\/\/:[^@]+@/, '//:*****@'), // Mask password
      error: error.message,
      help: "Make sure REDIS_URL is correctly set in Coolify environment variables"
    });
  }
});

app.get('/screenshot', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing URL parameter');
  
  try {
    // Check cache
    const cached = await redis.get(url);
    if (cached) {
      res.set('Content-Type', 'image/png');
      return res.send(Buffer.from(cached, 'base64'));
    }
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();
    
    // Save screenshot to data directory
    const urlSafe = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
    const filename = `${urlSafe}_${Date.now()}.png`;
    const filePath = path.join(dataDir, filename);
    
    try {
      fs.writeFileSync(filePath, screenshot);
      console.log(`Screenshot saved to ${filePath}`);
    } catch (fileError) {
      console.error(`Error saving screenshot to file: ${fileError.message}`);
    }
    
    // Cache result in Redis
    await redis.set(url, screenshot.toString('base64'), 'EX', 3600);
    
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Endpoint to list all saved screenshots
app.get('/screenshots', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.png'))
      .map(file => {
        const stats = fs.statSync(path.join(dataDir, file));
        return {
          filename: file,
          created: stats.birthtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.created - a.created); // Sort by creation date, newest first
    
    res.json({
      count: files.length,
      screenshots: files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Playwright microservice running on port ${port}`);
  console.log(`Data directory: ${dataDir}`);
});