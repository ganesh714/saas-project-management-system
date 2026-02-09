# Technical Specification

## 1. Project Structure

The project is a monorepo containing both Backend and Frontend.

```
saas-project-management-system/
├── backend/                # Express.js Backend
│   ├── config/             # DB & App Configuration
│   ├── middleware/         # Auth & Tenant Isolation Middleware
│   ├── migrations/         # SQL Migration Files
│   ├── routes/             # API Route Definitions
│   ├── seeds/              # Seed Data Scripts
│   ├── src/
│   │   ├── server.js       # Entry Point
│   │   └── services/       # Business Logic
│   ├── Dockerfile          # Backend Docker Configuration
│   └── package.json
│
├── frontend/               # React (Vite) Frontend
│   ├── public/             # Static Assets
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── context/        # React Context (Auth, Theme)
│   │   ├── layouts/        # Page Layouts
│   │   ├── pages/          # Main Page Views
│   │   ├── services/       # API Service Calls
│   │   ├── App.jsx         # Main App Component
│   │   └── main.jsx        # Entry Point
│   ├── Dockerfile          # Frontend Docker Configuration
│   └── package.json
│
├── docs/                   # Documentation
├── docker-compose.yml      # Container Orchestration
└── README.md
```

## 2. Development Setup Guide

### Prerequisites
*   Node.js v18+
*   Docker & Docker Compose
*   PostgreSQL (if running locally without Docker)

### Environment Variables
Create a `.env` file in `backend/` (or rely on `docker-compose.yml` for containerized run).

**Backend (.env):**
```bash
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

**Frontend:**
The frontend uses `VITE_API_URL` to communicate with the backend.
*   Development: `http://localhost:5000/api`
*   Production (Docker): `http://localhost:5000/api` (Browser resolves localhost)

### How to Run (Docker - Recommended)
The entire application (DB + Backend + Frontend) can be started with a single command:

```bash
docker-compose up -d
```
*   **Frontend:** http://localhost:3000
*   **Backend:** http://localhost:5000
*   **Database:** Port 5432 exposed to host.

### How to Run Locally (Manual)
1.  **Start Database:** Ensure Postgres is running.
2.  **Backend:**
    ```bash
    cd backend
    npm install
    npm run migrate  # Run SQL migrations
    npm run seed     # Load seed data
    npm start
    ```
3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Testing
*   **Health Check:** `GET http://localhost:5000/api/health`
    *   Response: `{"status":"ok","database":"connected"}`
