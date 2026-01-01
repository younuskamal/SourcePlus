# 🌐 SourcePlus Infrastructure & Licensing Oracle

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Stable-emerald.svg)]()
[![Platform: Cross-Platform](https://img.shields.io/badge/Platform-Cross--Platform-blueviolet.svg)]()

**SourcePlus** is a high-performance, enterprise-grade licensing and telemetry orchestration engine designed for modern desktop and POS applications. It provides a secure, scalable, and visually stunning administrative environment for managing global node deployments, subscription lifecycles, and real-time system health.

---

## 🚀 Core Architecture

The system is built on a mission-critical stack designed for zero-downtime and high data integrity.

- **Backend (Nexus)**: Built with **Fastify (TypeScript)**, leveraging **Prisma 7** for ultra-fast type-safe database queries and **PostgreSQL** for relational stability.
- **Frontend (Control Center)**: A sophisticated **React 19 + Vite** application utilizing advanced **Glassmorphism** aesthetics and **TailwindCSS** for a premium, infrastructure-first UI/UX.
- **Telemetry Layer**: Real-time monitoring of node health, storage usage, and active user seats across global deployments.

---

## 🛠 Project Topology

```bash
├── 💻 client/         # React Administrative Control Center (Vite)
├── ⚙️ server/         # Fastify Core API & Prisma Schema
├── 🐳 docker/         # Orchestration & Containerization configs
└── 🛡️ shared/         # Universal type definitions and protocols
```

---

## 💎 Key Capabilities

### 🛡️ Secure Provisioning
- **JWT Orchestration**: Advanced access and refresh token rotation with dedicated session management.
- **Role-Based Protocols**: (Admin, Developer, Viewer) hierarchies with granular permission enforcement.

### 📊 Infrastructure Telemetry
- **Node Monitoring**: Track live performance, version drift, and resource utilization (CPU, Memory, Storage) of remote nodes.
- **Global Topology**: Visual overview of all provisioned clinics and their operational status.

### 💳 Subscription & Licensing
- **Dynamic Serial Generation**: Instant cryptographic key provisioning based on subscription tier templates.
- **Multi-Currency Support**: Native support for global billing with real-time exchange rate sync.
- **Node Isolation**: One-click remote suspension and forced-logout protocols for security enforcement.

### 💾 Disaster Recovery
- **Snapshot Engine**: Automated and manual JSON-based backup systems with secure cloud upload/restore capabilities.

---

## 🚦 Deployment Protocol

### ⚡ Quick Start (Local)

1. **Initialize Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Launch Infrastructure**:
   ```bash
   npm run dev
   ```

### 🌍 Cloud Deployment (Render/Production)

**Backend Core (Node.js)**:
- **Build**: `cd server && npm install && npx prisma migrate deploy && npx prisma generate && npm run build`
- **Port**: `10000` (Managed via `PORT` environment variable)

**Frontend static site**:
- **Build**: `npm install && npm run build`
- **Output**: `client/build`

---

## 🔐 Initial Credentials

Upon first initialization, the system provisions an immutable root administrator:

- **Identity**: `admin@sourceplus.com`
- **Key**: `Admin12345`
- **Role**: `admin` (Level 1 Authority)

*It is recommended to rotate this key immediately upon first uplink.*

---

## 📖 Extended Documentation

For detailed protocol specifications, database ERDs, and request-flow diagrams (available in Arabic), please refer to the `SYSTEM_OVERVIEW_AR.md`.

---

<div align="center">
  <p>Built with precision by the <b>SourcePlus Engineering Team</b></p>
  <p>© 2026 SourcePlus. All rights reserved.</p>
</div>
