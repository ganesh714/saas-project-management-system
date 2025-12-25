# System Architecture Document

## 1. High-Level Architecture

The Multi-Tenant SaaS Platform follows a classic 3-Tier Layered Architecture designed for separation of concerns, scalability, and maintainability.

### 1.1 Architecture Layers
1.  **Presentation Layer (Client):**
    *   **Technology:** React.js (Single Page Application).
    *   **Responsibility:** Renders the user interface, manages client-side state (Auth Context), and communicates with the backend via REST APIs.
2.  **Application Layer (Server):**
    *   **Technology:** Node.js with Express.
    *   **Responsibility:** Handles business logic, RBAC enforcement, Tenant Isolation middleware, and request validation.
3.  **Data Layer (Database):**
    *   **Technology:** PostgreSQL.
    *   **Responsibility:** Persists data with strict referential integrity. Stores relationally mapped data for Tenants, Users, Projects, etc.

### 1.2 Container Architecture (Docker)
The system is deployed as a set of isolated containers orchestrated via Docker Compose:

*   **Service: Frontend (`frontend`)**
    *   Exposed Port: `3000`
    *   Interacts with: Backend Service (via HTTP).
*   **Service: Backend (`backend`)**
    *   Exposed Port: `5000`
    *   Interacts with: Database Service.
*   **Service: Database (`database`)**
    *   Exposed Port: `5432`
    *   Data Persistence: Docker Volume (`db_data`).

---

## 2. Database Design (Schema)

The database follows a **Shared Schema** multi-tenancy model. The `Tenants` table is the root entity. Almost every other entity links back to a Tenant via the `tenant_id` Foreign Key.

### 2.1 Entity Relationships (ERD Description)

#### Table: Tenants
*   **Description:** The root organization unit.
*   **Columns:** `id` (PK), `name`, `subdomain` (Unique), `status`, `plan`, `max_users`, `max_projects`.
*   **Relationships:** One Tenant has many Users, Projects, and Tasks.

#### Table: Users
*   **Description:** System actors.
*   **Columns:** `id` (PK), `tenant_id` (FK), `email`, `password_hash`, `role` (super_admin, tenant_admin, user), `is_active`.
*   **Isolation:** `tenant_id` ensures users belong to exactly one organization (except Super Admins).

#### Table: Projects
*   **Description:** A container for tasks.
*   **Columns:** `id` (PK), `tenant_id` (FK), `created_by` (FK -> Users), `name`, `description`, `status`.
*   **Relationships:** Belongs to Tenant. Belongs to Creator (User). Has many Tasks.

#### Table: Tasks
*   **Description:** The unit of work.
*   **Columns:** `id` (PK), `tenant_id` (FK), `project_id` (FK -> Projects), `assigned_to` (FK -> Users), `title`, `status`, `priority`.
*   **Relationships:** Belongs to Tenant (Critical for isolation), Project, and Assignee.

#### Table: AuditLogs
*   **Description:** Security trail of actions.
*   **Columns:** `id`, `tenant_id`, `user_id`, `action` (e.g., 'CREATE_PROJECT'), `ip_address`, `timestamp`.

---

## 3. API Specification

All API endpoints are prefixed with `/api`.
**Common Headers:** `Authorization: Bearer <token>` (Required for all except Auth).

### 3.1 Module: Authentication
*   `POST /api/auth/register-tenant` : Register a new Tenant Organization + Admin User. (Public)
*   `POST /api/auth/login` : Login with Email/Password + Subdomain. Returns JWT. (Public)
*   `GET /api/auth/me` : Get current logged-in user details & role. (Auth)
*   `POST /api/auth/logout` : Invalidate session (Client side). (Auth)

### 3.2 Module: Tenant Management
*   `GET /api/tenants` : List all tenants. (Super Admin Only)
*   `GET /api/tenants/:id` : Get details of a specific tenant. (Tenant Admin / Super Admin)
*   `PUT /api/tenants/:id` : Update tenant details (e.g., Name). (Tenant Admin)

### 3.3 Module: User Management
*   `POST /api/tenants/:tenantId/users` : Add a new user to the tenant. Checks subscription limits. (Tenant Admin)
*   `GET /api/tenants/:tenantId/users` : List users in the tenant. (Auth)
*   `PUT /api/users/:userId` : Update user profile or role. (Tenant Admin / Self)
*   `DELETE /api/users/:userId` : Remove a user. (Tenant Admin)

### 3.4 Module: Project Management
*   `POST /api/projects` : Create a new project. Checks subscription limits. (Auth)
*   `GET /api/projects` : List all projects for the current tenant. (Auth)
*   `GET /api/projects/:id` : Get specific project details. (Auth)
*   `PUT /api/projects/:id` : Update project. (Creator / Tenant Admin)
*   `DELETE /api/projects/:id` : Delete project (Cascades to tasks). (Creator / Tenant Admin)

### 3.5 Module: Task Management
*   `POST /api/projects/:projectId/tasks` : Create a task within a project. (Auth)
*   `GET /api/projects/:projectId/tasks` : List tasks for a project. (Auth)
*   `PUT /api/tasks/:id` : Update task details. (Auth)
*   `PATCH /api/tasks/:id/status` : Quick update for task status (Kanban drag-and-drop). (Auth)
*   `DELETE /api/tasks/:id` : Delete a task. (Auth)
