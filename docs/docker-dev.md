# Docker Development

Start the full local stack:

```bash
npm run dev:docker
```

This starts:

- Web: http://localhost:5173
- API: http://localhost:3000/api
- MySQL: localhost:3306

The API container waits for MySQL, runs `prisma generate`, pushes the Prisma schema to the local development database, then starts the Fastify dev server.

The Vite dev server proxies `/api` to the API container, so the web app can use cloud sync from `http://localhost:5173` without extra browser configuration.

Useful reset command:

```bash
docker compose down -v
```

That removes the local MySQL data volume and starts from a clean database on the next `npm run dev:docker`.
