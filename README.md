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
5. Make sure the service is connected to the Coolify network (this is configured in the docker-compose.yml)
6. Deploy the service

### Coolify Network Configuration

The docker-compose.yml file is configured to connect to the Coolify network, which allows this service to communicate with other services in your Coolify environment, including Redis/Dragonfly.

```yaml
networks:
  coolify:
    external: true
```

This configuration ensures that the Playwright microservice can access your Redis instance through the Coolify network.

The docker-compose.yml also includes:
- Container name: `cool-playwright`
- Traefik labels for routing (customize the hostname as needed)
- Restart policy: `unless-stopped`
- Volume for persistent data: `playwright_data`

### Data Persistence

The service uses a Docker volume (`playwright_data`) to persist screenshots between container restarts. This ensures that:

1. Screenshots are not lost if the container is restarted
2. You can access historical screenshots even if they're no longer in the Redis cache
3. The data can be backed up or migrated independently of the container

The volume is mounted at `/app/data` inside the container.

### Important Notes on Redis Configuration

- The service requires a Redis connection to function properly
- The Redis URL can be configured in three ways:
  1. Set as an environment variable in Coolify (recommended)
  2. It's included as a default in the Dockerfile
  3. It can be set in docker-compose.yml for local development

- If you see Redis connection errors, check that your REDIS_URL is correctly set in Coolify
- Ensure that both the Playwright service and Redis service are on the same Coolify network

## API Endpoints

### Screenshot API

```
GET /screenshot?url=https://example.com
```

Returns a PNG screenshot of the specified URL. Screenshots are both cached in Redis and saved to the persistent data volume.

### List Screenshots

```
GET /screenshots
```

Returns a list of all screenshots saved to the persistent data volume, including filenames, creation dates, and file sizes.

### Health Check

```
GET /health
```

Returns the health status of the service, including Redis connection status and environment information.

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