# Technical Specification

## 1. Project Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/         # Database and app config
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, error handling, validation
│   ├── models/         # Database models/schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (optional)
│   ├── utils/          # Helper functions
│   └── server.js       # App entry point
├── migrations/         # SQL migration files
├── seeds/              # SQL seed files
├── .env.example        # Environment variable template
├── Dockerfile          # Docker build instructions
└── package.json        # Dependencies
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (Auth, etc.)
│   ├── hooks/          # Custom hooks
│   ├── layouts/        # Page layouts
│   ├── pages/          # Application pages
│   ├── services/       # API client services
│   ├── styles/         # Global styles/Tailwind config
│   └── App.jsx         # Main component
├── public/             # Static assets
├── Dockerfile          # Docker build instructions
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## 2. Development Setup Guide

### Prerequisites
-   Node.js v18+
-   Docker and Docker Compose
-   Git

### Environment Variables
Create a `.env` file in the `backend` directory based on `.env.example`.

**Required Variables:**
-   `PORT`: API port (default 5000)
-   `DATABASE_URL`: Postgres connection string
-   `JWT_SECRET`: Secret key for token signing
-   `FRONTEND_URL`: URL of the frontend app

### Installation
1.  Clone the repository.
2.  Install Backend Dependencies:
    ```bash
    cd backend
    npm install
    ```
3.  Install Frontend Dependencies:
    ```bash
    cd frontend
    npm install
    ```

### Running Locally with Docker (Recommended)
1.  From the project root:
    ```bash
    docker-compose up -d
    ```
2.  Access the application:
    -   Frontend: `http://localhost:3000`
    -   Backend: `http://localhost:5000`
    -   Database: Port `5432`

### Running Manually
1.  Start Database (e.g., local Postgres or Docker container).
2.  Run Migrations: `npm run migrate` (backend).
3.  Seed Data: `npm run seed` (backend).
4.  Start Backend: `npm run dev`.
5.  Start Frontend: `npm run dev`.
