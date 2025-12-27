# SaaS Project Management System

A production-ready, multi-tenant SaaS application for project and task management.

## Features
- **Multi-Tenancy**: Data isolation using Shared Database, Shared Schema strategy with `tenant_id`.
- **Authentication**: JWT-based auth with Role-Based Access Control (RBAC).
- **Tenant Management**: Create and manage organizations with subscription limits.
- **Projects & Tasks**: Full project management capabilities.
- **Premium UI**: Modern, glassmorphism-inspired interface.

## Tech Stack
- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Vite, Vanilla CSS (Premium Design)
- **Infrastructure**: Docker, Docker Compose

## Quick Start

1. **Clone the repository** (if applicable).
2. **Run with Docker**:
   ```bash
   docker-compose up --build
   ```
3. **Access App**: [http://localhost:3000](http://localhost:3000)

## Credentials (Seed Data)
| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| **Super Admin** | `superadmin@system.com` | `Admin@123` | N/A |
| **Tenant Admin** | `admin@demo.com` | `Demo@123` | `demo` |
| **User** | `user1@demo.com` | `User@123` | `demo` |

## Documentation
See `docs/` folder for:
- [Architecture](docs/architecture.md)
- [PRD](docs/PRD.md)
- [Technical Spec](docs/technical-spec.md)
