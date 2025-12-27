# System Architecture

## 1. High-Level Architecture

The system follows a typical 3-tier architecture containerized with Docker.

```mermaid
graph TD
    Client[Client Browser] -->|HTTP/REST| LB[Nginx/Load Balancer]
    LB -->|Port 3000| Frontend[React Frontend Container]
    LB -->|Port 5000| Backend[Node.js Backend Container]
    Backend -->|Port 5432| DB[PostgreSQL Container]
    
    subgraph Docker Network
        Frontend
        Backend
        DB
    end
```

## 2. Database Schema (ERD)

```mermaid
erDiagram
    TENANTS ||--o{ USERS : has
    TENANTS ||--o{ PROJECTS : owns
    TENANTS ||--o{ AUDIT_LOGS : generates
    PROJECTS ||--o{ TASKS : contains
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ PROJECTS : created_by

    TENANTS {
        uuid id PK
        string name
        string subdomain UK
        enum status
        enum subscription_plan
        int max_users
        int max_projects
        timestamp created_at
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        string email
        string password_hash
        string full_name
        enum role
        boolean is_active
    }

    PROJECTS {
        uuid id PK
        uuid tenant_id FK
        string name
        text description
        enum status
        uuid created_by FK
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        uuid tenant_id FK
        string title
        text description
        enum status
        enum priority
        uuid assigned_to FK
        date due_date
    }

    AUDIT_LOGS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        timestamp created_at
    }
```

## 3. API Architecture

### Authentication
- `POST /api/auth/register-tenant` (Public)
- `POST /api/auth/login` (Public)
- `GET /api/auth/me` (Auth Required)
- `POST /api/auth/logout` (Auth Required)

### Tenant Management
- `GET /api/tenants` (Super Admin)
- `GET /api/tenants/:tenantId` (Auth Required)
- `PUT /api/tenants/:tenantId` (Admin/Super Admin)

### User Management
- `POST /api/tenants/:tenantId/users` (Tenant Admin)
- `GET /api/tenants/:tenantId/users` (Auth Required)
- `PUT /api/users/:userId` (Tenant Admin/Self)
- `DELETE /api/users/:userId` (Tenant Admin)

### Project Management
- `POST /api/projects` (Auth Required)
- `GET /api/projects` (Auth Required)
- `PUT /api/projects/:projectId` (Auth Required)
- `DELETE /api/projects/:projectId` (Auth Required)

### Task Management
- `POST /api/projects/:projectId/tasks` (Auth Required)
- `GET /api/projects/:projectId/tasks` (Auth Required)
- `GET /api/tasks/:taskId` (Auth Required)
- `PUT /api/tasks/:taskId` (Auth Required)
- `PATCH /api/tasks/:taskId/status` (Auth Required)
- `DELETE /api/tasks/:taskId` (Auth Required)

### System
- `GET /api/health` (Public)
