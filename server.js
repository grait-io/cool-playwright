const express = require('express');
const { chromium } = require('playwright');
const Redis = require('ioredis');

const app = express();
const port = 3000;

// Use REDIS_URL from environment or fallback to local Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
const redis = new Redis(redisUrl);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redis.ping();
    res.status(200).json({ status: 'healthy', redis: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', redis: 'disconnected', error: error.message });
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
    
    // Cache result
    await redis.set(url, screenshot.toString('base64'), 'EX', 3600);
    
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Playwright microservice running on port ${port}`);
});