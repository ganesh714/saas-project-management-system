# Multi-Tenant SaaS Platform

A production-ready SaaS platform with project & task management capabilities, featuring complete data isolation, role-based access control, and subscription management.

## Project Structure

```
saas-platform/
├── backend/            # Express.js REST API
├── frontend/           # React.js Frontend
├── database/           # Migrations and Seeds
└── docker-compose.yml  # Docker Orchestration
```

## Features

- **Multi-Tenancy**: Data isolation via tenant_id.
- **Authentication**: JWT-based auth with RBAC (Super Admin, Tenant Admin, User).
- **Subscription Management**: Free, Pro, and Enterprise plans with limits.
- **Dockerized**: Complete environment setup with one command.

## Tech Stack

- **Backend**: Node.js, Express, Sequelize, PostgreSQL
- **Frontend**: React, Axios, Context API
- **DevOps**: Docker, Docker Compose

## Prerequisites

- Docker Desktop installed and running.

## Quick Start

1. **Clone the repository** (if not already done).

2. **Navigate to the project root**:
   ```bash
   cd saas-platform
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify services**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - Database: Port 5432

## Environment Variables

Default development variables are provided in `docker-compose.yml`. For local development without Docker, copy `backend/.env.example` to `backend/.env`.

## Architecture

(Architecture documentation to be added in `docs/architecture.md`)
