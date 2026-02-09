
# SaaS Project Management System

A production-ready, multi-tenant SaaS application for project and task management.

## Demo
[Watch the Demo Video](https://drive.google.com/file/d/1FRhQ_xpXUBfIfwR4R3b6RNHWcoVhGuFg/view?usp=sharing)

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

## Installation & Setup

### Prerequisites
*   Docker & Docker Compose
*   Node.js v18+ (for local development)

### Environment Variables
The application comes with pre-configured environment variables in `docker-compose.yml` for simplicity.
However, for local development, create a `.env` file in the `backend` directory:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

### Running with Docker (Recommended)
1.  Clone the repository.
2.  Run the following command in the root directory:
    ```bash
    docker-compose up -d --build
    ```
3.  Access the application:
    *   **Frontend:** [http://localhost:3000](http://localhost:3000)
    *   **Backend:** [http://localhost:5000](http://localhost:5000)

### Running Locally
1.  **Database:** Ensure PostgreSQL is running.
2.  **Backend:**
    ```bash
    cd backend
    npm install
    npm run migrate
    npm run seed
    npm start
    ```
3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Credentials (Seed Data)

| Role | Email | Password | Tenant |
| --- | --- | --- | --- |
| **Super Admin** | `superadmin@system.com` | `Admin@123` | N/A |
| **Tenant Admin** | `admin@demo.com` | `Demo@123` | `demo` |
| **User** | `user1@demo.com` | `User@123` | `demo` |

## Documentation

See `docs/` folder for:

* [Architecture](https://www.google.com/search?q=docs/architecture.md)
* [PRD](https://www.google.com/search?q=docs/PRD.md)
* [Technical Spec](https://www.google.com/search?q=docs/technical-spec.md)
* [API Documentation](https://www.google.com/search?q=docs/API.md)
