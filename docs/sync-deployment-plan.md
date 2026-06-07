# Metidy Sync Deployment Plan

## Shape

Metidy stays in one repository:

- `src/`: existing React PWA.
- `server/`: Fastify API, Prisma schema, MySQL access, sync endpoints.
- `packages/shared/`: request/response contracts shared by web and server.

The first production deployment should keep the backend as a single Node.js process behind Nginx. MySQL stores structured data. OSS stores photos and future import/export archives.

## Server Runtime

Nginx should serve the built PWA and proxy API requests:

```text
/                 -> /opt/metidy/current/dist
/api/*            -> http://127.0.0.1:3000/api/*
```

The API can run under PM2:

```bash
npm ci
npm run build:all
npm run db:generate
npm --workspace server run db:migrate
pm2 start server/dist/index.js --name metidy-api
pm2 save
```

## Required Environment

Create `server/.env` from `server/.env.example`:

```text
DATABASE_URL=mysql://...
JWT_SECRET=at-least-32-characters
PORT=3000
OSS_REGION=...
OSS_BUCKET=...
```

## Sync Contract

The API starts with two endpoints:

- `POST /api/sync/push`: upload local outbox changes.
- `GET /api/sync/pull?cursor=0`: fetch remote changes after a cursor.

Version and `base_version` are part of the protocol from day one, even if the first implementation uses last-write-wins. That keeps room for better conflict handling later.

## Data Durability Rules

- Business rows use `deleted_at` for soft delete.
- Business rows use `version` for conflict detection.
- `sync_changes` is append-only and cursor-based.
- Photos are metadata rows in MySQL and file objects in OSS.

## Near-Term Implementation Order

1. Add auth routes: register, login, refresh token, device registration.
2. Add server-side apply logic for sync changes instead of only recording `sync_changes`.
3. Add Dexie `sync_outbox` and `sync_meta`.
4. Wire current service layer to write local changes into `sync_outbox`.
5. Add a background sync worker in the PWA.
6. Add OSS-backed photo upload.
