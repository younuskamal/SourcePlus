# SourcePlus Licensing Server

Full-stack licensing and subscription server for desktop / POS apps, built with:

- **Backend**: Fastify (TypeScript), Prisma 7, PostgreSQL
- **Frontend**: React + Vite (TypeScript), TailwindCSS
- **Deployment target**: Render (Node service for API + Static site for client)

The server exposes REST APIs for license validation, activation, updates, backups and admin dashboards, and the client is an admin panel for managing plans, licenses, customers, updates, support tickets and system settings.

---

## Project structure

- `server/` – Fastify API + Prisma schema and migrations
- `client/` – React admin dashboard (Vite)
- `docker-compose.yml`, `Dockerfile.frontend`, `server/Dockerfile` – optional container deployment

---

## Backend (server/)

### Tech stack

- Fastify + plugins (`@fastify/jwt`, `@fastify/cors`, `@fastify/multipart`, `@fastify/sensible`)
- Prisma 7 + `@prisma/adapter-pg` + `pg` (PostgreSQL)
- bcrypt لتهشير كلمات المرور
- Zod للتحقق من المدخلات

### Key features

- User auth (JWT access + refresh tokens, sessions table)
- Role-based access (admin / developer / viewer)
- License & plan management (plans, prices, currencies, transactions)
- Licensing APIs for clients (under `/api`):
  - `/api/license/validate`
  - `/api/license/activate`
  - `/api/subscription/status`
  - `/api/app/update`
  - `/api/config/sync`
  - `/api/support/request`
- Notifications, support tickets, audit logs
- System settings + remote config
- Backup module (create/list/download/restore/upload JSON snapshots)

### Environment variables (server)

Set these for local dev in `server/.env` and on Render in the service environment:

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string                     |
| `JWT_SECRET`    | Secret for signing JWT access/refresh tokens     |
| `PORT`          | Port to bind Fastify (Render uses 10000)         |

Prisma is configured via `server/prisma.config.ts` and always enforces `sslmode=require` when talking to Render’s managed Postgres.

### Running the server locally

```bash
cd server
npm install
npx prisma migrate dev         # أو migrate deploy إذا كانت الـ DB جاهزة
npx prisma generate
npm run dev                    # تشغيل Fastify في وضع التطوير
```

Production build:

```bash
cd server
npm run build                  # tsc → dist/
npm start                      # node dist/main.js
```

---

## Frontend (client/)

The client is a Vite/React admin panel that talks to the server via `VITE_API_URL`.

### Environment variables (client)

Create `client/.env` (or configure in Render Static site):

```env
VITE_API_URL=https://sourceplus.onrender.com
```

### Running the client locally

```bash
cd client
npm install
npm run dev        # http://localhost:5173 by default
```

Production build (used by Render Static Site):

```bash
cd client
npm run build      # outputs to client/build
```

---

## Deployment on Render (recommended)

### API service (Node)

- **Root directory**: `server`
- **Build command**:
  ```bash
  cd server && npm install && npx prisma migrate deploy && npx prisma generate && npm run build
  ```
- **Start command**:
  ```bash
  cd server && npm start
  ```
- **Environment variables**: `DATABASE_URL`, `JWT_SECRET`, `PORT`

### Admin client (Static site)

- **Root directory**: `client`
- **Build command**:
  ```bash
  npm install && npm run build
  ```
- **Publish directory**: `build`
- **Environment variables**: `VITE_API_URL=https://sourceplus.onrender.com`

---

## Initial admin user

On first boot, the backend seed ensures an admin account exists (idempotent):

- Email: `admin@sourceplus.com`
- Password: `Admin12345`
- Role: `admin`

Use these credentials to log in to the admin dashboard, then create additional users and change the password from there.

---

## More details

For a detailed explanation of modules, database models, and request flows (in Arabic), see `SYSTEM_OVERVIEW_AR.md`.
