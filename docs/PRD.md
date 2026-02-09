# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin
*   **Role Description:** The system administrator who manages the entire SaaS platform.
*   **Key Responsibilities:** Managing tenants (organizations), monitoring system health, managing global configurations.
*   **Main Goals:** Ensure the platform is running smoothly, onboard new tenants, manage subscription plans.
*   **Pain Points:** Lack of visibility into tenant usage, manual onboarding processes.

### 1.2 Tenant Admin
*   **Role Description:** The administrator for a specific organization (Tenant).
*   **Key Responsibilities:** Managing their organization's projects, users, and billing.
*   **Main Goals:** Organize team work effectively, control access to projects, ensure data security for their org.
*   **Pain Points:** Difficulty in managing user permissions, hitting plan limits without warning.

### 1.3 End User
*   **Role Description:** A regular team member within an organization.
*   **Key Responsibilities:** Executing tasks, updating project status, collaborating with team members.
*   **Main Goals:** Complete assigned tasks on time, track project progress.
*   **Pain Points:** Confusing interface, difficulty finding assigned tasks.

## 2. Functional Requirements

### Authentication Module
*   **FR-001:** The system shall allow Tenant Admins to register their organization (Tenant) with a unique subdomain.
*   **FR-002:** The system shall allow users to log in using email and password, returning a JWT.
*   **FR-003:** The system shall enforce a 24-hour expiration for authentication tokens.

### Tenant Management Module
*   **FR-004:** The system shall allow Super Admins to view a list of all tenants.
*   **FR-005:** The system shall allow Tenant Admins to view and update their own organization's details.
*   **FR-006:** The system shall enforce subscription limits (Max Users, Max Projects) based on the tenant's plan.

### User Management Module
*   **FR-007:** The system shall allow Tenant Admins to add new users to their organization.
*   **FR-008:** The system shall prevent adding users if the subscription limit is reached.
*   **FR-009:** The system shall allow Tenant Admins to delete users (soft delete or remove access).
*   **FR-010:** The system shall allow users to update their own profile information.

### Project Management Module
*   **FR-011:** The system shall allow users to create new projects within their tenant.
*   **FR-012:** The system shall restrict project creation if the tenant's project limit is reached.
*   **FR-013:** The system shall lists projects only belonging to the authenticated user's tenant.

### Task Management Module
*   **FR-014:** The system shall allow users to create tasks within a specific project.
*   **FR-015:** The system shall allow users to update task status (Todo -> In Progress -> Done).
*   **FR-016:** The system shall allow users to assign tasks to other users within the same tenant.

### Audit Logging
*   **FR-017:** The system shall log all critical actions (Create/Update/Delete) to an audit log table.

## 3. Non-Functional Requirements

*   **NFR-001 (Security):** All passwords must be hashed using a strong algorithm (e.g., bcrypt) before storage. Data must be isolated logically by `tenant_id`.
*   **NFR-002 (Performance):** API response time should be under 200ms for 95% of requests. Database queries must use indexes on `tenant_id`.
*   **NFR-003 (Scalability):** The system must support horizontal scaling of the backend application (stateless).
*   **NFR-004 (Availability):** The system should be designed for 99.9% uptime (excluding maintenance).
*   **NFR-005 (Usability):** The frontend application must be responsive and usable on mobile devices. Error messages must be clear and user-friendly.
