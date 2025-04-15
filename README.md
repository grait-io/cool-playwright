# Playwright Microservice

A microservice that provides a screenshot API endpoint with Redis caching.

## Features

- Takes screenshots of websites using Playwright
- Caches screenshots in Redis for improved performance
- Includes health check endpoint
- Docker and Coolify ready

## Deployment in Coolify

### Prerequisites

- A Coolify instance
- Access to a Redis/Dragonfly instance

### Steps

1. Push all files to your GitHub repository at https://github.com/grait-io/cool-playwright.git
2. In Coolify, create a new service from this repo
3. Select **Dockerfile** as the build method
4. Set the `REDIS_URL` environment variable in Coolify:
   ```
   redis://:tZsWtGzZ74cY0sbUdi19ozWDz05QzgigxnVIU18klQBXBvMCU4K1eQyUNN1a6WXM@aossows84gw8k8okcocs4cks:6379/0
   ```
   (Or your own Redis URL)
5. Deploy the service

### Important Notes on Redis Configuration

- The service requires a Redis connection to function properly
- The Redis URL can be configured in three ways:
  1. Set as an environment variable in Coolify (recommended)
  2. It's included as a default in the Dockerfile
  3. It can be set in docker-compose.yml for local development

- If you see Redis connection errors, check that your REDIS_URL is correctly set in Coolify

## API Endpoints

### Screenshot API

```
GET /screenshot?url=https://example.com
```

Returns a PNG screenshot of the specified URL.

### Health Check

```
GET /health
```

Returns the health status of the service, including Redis connection status.

## Testing

After deployment, test with:

```
curl "http://<your-coolify-service-url>/screenshot?url=https://example.com" --output screenshot.png
```

## Troubleshooting

If you encounter Redis connection issues:

1. Check the logs for detailed error messages
2. Verify that the REDIS_URL environment variable is correctly set in Coolify
3. Make sure your Redis instance is accessible from the Coolify service
4. Try accessing the /health endpoint to see detailed connection status
5. Use the included Redis connection test script:
   ```
   npm run test-redis
   ```
   Or with a specific Redis URL:
   ```
   REDIS_URL="redis://:password@hostname:port/db" npm run test-redis
   ```